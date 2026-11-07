import { Router, Response } from 'express';
import prisma from '../prisma';
import { requireAuth } from '../middleware/auth';
import { AuthRequest } from '../types';

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

// GET /tasks/:id
router.get('/:id', async (req, res: Response) => {
  const task = await prisma.task.findUnique({ where: { id: req.params.id }, include: TASK_INCLUDE });
  if (!task) { res.status(404).json({ message: 'Not found' }); return; }
  res.json(task);
});

// POST /tasks/:taskId/comments
router.post('/:taskId/comments', async (req: AuthRequest, res: Response) => {
  const { body, parentId } = req.body;
  const comment = await prisma.taskComment.create({
    data: { taskId: req.params.taskId, body, parentId: parentId || null, authorId: req.user!.id },
    include: { author: { select: { id: true, fullName: true, avatarUrl: true } } },
  });
  res.status(201).json(comment);
});

// PATCH /tasks/comments/:id
router.patch('/comments/:id', async (_req, res: Response) => {
  const { body } = _req.body;
  const comment = await prisma.taskComment.update({
    where: { id: _req.params.id },
    data: { body, editedAt: new Date() },
    include: { author: { select: { id: true, fullName: true, avatarUrl: true } } },
  });
  res.json(comment);
});

// DELETE /tasks/comments/:id
router.delete('/comments/:id', async (req, res: Response) => {
  await prisma.taskComment.delete({ where: { id: req.params.id } });
  res.json({ message: 'Deleted' });
});

export default router;
