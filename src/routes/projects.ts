import { Router, Response } from 'express';
import prisma from '../prisma';
import { requireAuth } from '../middleware/auth';
import { AuthRequest } from '../types';
import { getIO } from '../services/socket';

const router = Router();
router.use(requireAuth);

const TASK_INCLUDE = {
  assignees: { include: { user: { select: { id: true, fullName: true, avatarUrl: true } } } },
  createdBy: { select: { id: true, fullName: true, avatarUrl: true } },
  comments: {
    where: { parentId: null },
    include: {
      author: { select: { id: true, fullName: true, avatarUrl: true } },
      replies: {
        include: {
          author: { select: { id: true, fullName: true, avatarUrl: true } },
          replies: { include: { author: { select: { id: true, fullName: true, avatarUrl: true } } } },
        },
      },
    },
    orderBy: { createdAt: 'asc' as const },
  },
  branches: true,
  labels: true,
};

// ── Projects ──────────────────────────────────────────────────────────────────

router.get('/', async (req: AuthRequest, res: Response) => {
  const projects = await prisma.project.findMany({
    where: { OR: [{ ownerId: req.user!.id }, { members: { some: { userId: req.user!.id } } }] },
    include: {
      owner: { select: { id: true, fullName: true, avatarUrl: true } },
      members: { include: { user: { select: { id: true, fullName: true, avatarUrl: true } } } },
      _count: { select: { tasks: true, members: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(projects);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, slug, color, startDate, endDate } = req.body;
    const project = await prisma.project.create({
      data: {
        name, description, color,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        ownerId: req.user!.id,
        members: { create: { userId: req.user!.id, role: 'OWNER' } },
      },
      include: {
        owner: { select: { id: true, fullName: true, avatarUrl: true } },
        members: { include: { user: { select: { id: true, fullName: true, avatarUrl: true } } } },
        _count: { select: { tasks: true, members: true } },
      },
    });
    res.status(201).json(project);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

router.get('/:id', async (req, res: Response) => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.id },
    include: {
      owner: { select: { id: true, fullName: true, avatarUrl: true } },
      members: { include: { user: { select: { id: true, fullName: true, avatarUrl: true } } } },
      repositories: true,
    },
  });
  if (!project) { res.status(404).json({ message: 'Not found' }); return; }
  res.json(project);
});

router.patch('/:id', async (req, res: Response) => {
  const { name, description, status, color, startDate, endDate } = req.body;
  const project = await prisma.project.update({
    where: { id: req.params.id },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(status && { status }),
      ...(color && { color }),
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) }),
    },
  });
  res.json(project);
});

router.delete('/:id', async (req, res: Response) => {
  await prisma.project.delete({ where: { id: req.params.id } });
  res.json({ message: 'Deleted' });
});

router.post('/:id/members', async (req, res: Response) => {
  const { userId, role } = req.body;
  const member = await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: req.params.id, userId } },
    create: { projectId: req.params.id, userId, role: role || 'DEVELOPER' },
    update: { role: role || 'DEVELOPER' },
  });
  res.json(member);
});

router.delete('/:id/members/:userId', async (req, res: Response) => {
  await prisma.projectMember.delete({
    where: { projectId_userId: { projectId: req.params.id, userId: req.params.userId } },
  });
  res.json({ message: 'Removed' });
});

// ── Tasks (project-scoped) ────────────────────────────────────────────────────

router.get('/:projectId/tasks', async (req, res: Response) => {
  const tasks = await prisma.task.findMany({
    where: { projectId: req.params.projectId },
    include: TASK_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });
  res.json(tasks);
});

router.post('/:projectId/tasks', async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, acceptanceCriteria, priority, status, dueDate, estimatedHours, assigneeIds } = req.body;
    const projectId = req.params.projectId;
    const count = await prisma.task.count({ where: { projectId } });
    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { slug: true } });
    const taskNumber = `${(project?.slug || 'TASK').toUpperCase()}-${count + 1}`;
    const task = await prisma.task.create({
      data: {
        title, description, acceptanceCriteria,
        priority: priority || 'MEDIUM',
        status: status || 'BACKLOG',
        taskNumber,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        estimatedHours: estimatedHours ? Number(estimatedHours) : undefined,
        projectId,
        createdById: req.user!.id,
        assignees: assigneeIds?.length ? { create: assigneeIds.map((userId: string) => ({ userId })) } : undefined,
      },
      include: TASK_INCLUDE,
    });
    getIO()?.to(`project:${projectId}`).emit('task:created', task);
    res.status(201).json(task);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

router.patch('/:projectId/tasks/:taskId', async (req: AuthRequest, res: Response) => {
  const { title, description, acceptanceCriteria, priority, status, dueDate, estimatedHours, actualHours, assigneeIds } = req.body;
  const task = await prisma.task.update({
    where: { id: req.params.taskId },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(acceptanceCriteria !== undefined && { acceptanceCriteria }),
      ...(priority && { priority }),
      ...(status && { status }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(estimatedHours !== undefined && { estimatedHours }),
      ...(actualHours !== undefined && { actualHours }),
      ...(assigneeIds && { assignees: { deleteMany: {}, create: assigneeIds.map((userId: string) => ({ userId })) } }),
    },
    include: TASK_INCLUDE,
  });
  getIO()?.to(`project:${req.params.projectId}`).emit('task:updated', task);
  res.json(task);
});

router.delete('/:projectId/tasks/:taskId', async (req, res: Response) => {
  const task = await prisma.task.delete({ where: { id: req.params.taskId } });
  getIO()?.to(`project:${req.params.projectId}`).emit('task:deleted', req.params.taskId);
  res.json({ message: 'Deleted' });
});

// ── Repositories (project-scoped) ─────────────────────────────────────────────

router.get('/:projectId/repositories', async (req, res: Response) => {
  const repos = await prisma.repository.findMany({
    where: { projectId: req.params.projectId },
    include: { _count: { select: { commits: true, branches: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(repos);
});

router.post('/:projectId/repositories', async (req: AuthRequest, res: Response) => {
  try {
    const { name, provider, cloneUrl, webUrl, defaultBranch } = req.body;
    const repo = await prisma.repository.create({
      data: {
        projectId: req.params.projectId,
        name,
        fullName: name,
        provider: provider || 'GITHUB',
        cloneUrl,
        webUrl,
        defaultBranch: defaultBranch || 'main',
        addedById: req.user!.id,
      },
    });
    res.status(201).json(repo);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

export default router;
