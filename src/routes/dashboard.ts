import { Router, Response } from 'express';
import prisma from '../prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/stats', async (_req, res: Response) => {
  const [total, inProgress, uat, aiReview, qaBaReview, completed, blocked, overdue] = await Promise.all([
    prisma.task.count(),
    prisma.task.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.task.count({ where: { status: 'UAT' } }),
    prisma.task.count({ where: { status: 'AI_REVIEW' } }),
    prisma.task.count({ where: { status: 'QA_BA_REVIEW' } }),
    prisma.task.count({ where: { status: 'COMPLETED' } }),
    prisma.task.count({ where: { status: 'BLOCKED' } }),
    prisma.task.count({ where: { dueDate: { lt: new Date() }, status: { notIn: ['COMPLETED'] } } }),
  ]);

  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: {
      id: true, fullName: true, username: true,
      assignedTasks: { where: { task: { status: { not: 'COMPLETED' } } }, select: { taskId: true } },
    },
  });
  const teamPerformance = users.map((u) => ({
    id: u.id,
    fullName: u.fullName,
    username: u.username,
    activeTasks: u.assignedTasks.length,
    inProgress: 0,
  }));

  res.json({ total, inProgress, uat, aiReview, qaBaReview, completed, blocked, overdue, teamPerformance });
});

export default router;
