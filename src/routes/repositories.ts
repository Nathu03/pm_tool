import { Router, Response } from 'express';
import prisma from '../prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/', async (_req, res: Response) => {
  const repos = await prisma.repository.findMany({
    include: {
      project: { select: { id: true, name: true, slug: true } },
      _count: { select: { commits: true, branches: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(repos);
});

router.get('/:id', async (req, res: Response) => {
  const repo = await prisma.repository.findUnique({
    where: { id: req.params.id },
    include: {
      project: { select: { id: true, name: true, slug: true } },
      commits: {
        include: { task: { select: { id: true, taskNumber: true, title: true } } },
        orderBy: { committedAt: 'desc' },
        take: 20,
      },
      branches: {
        include: { task: { select: { id: true, taskNumber: true, title: true } } },
      },
    },
  });
  if (!repo) { res.status(404).json({ message: 'Not found' }); return; }
  res.json(repo);
});

router.delete('/:id', async (req, res: Response) => {
  await prisma.repository.delete({ where: { id: req.params.id } });
  res.json({ message: 'Deleted' });
});

router.post('/:id/branches', async (req, res: Response) => {
  const { taskId, branchName } = req.body;
  const branch = await prisma.taskBranch.create({
    data: { taskId, branchName, repositoryId: req.params.id },
  });
  res.status(201).json(branch);
});

export default router;
