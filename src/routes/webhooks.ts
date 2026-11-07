import { Router, Request, Response } from 'express';
import prisma from '../prisma';

const router = Router();

router.post('/github/:repositoryId', async (req: Request, res: Response) => {
  try {
    const { repositoryId } = req.params;
    const event = req.headers['x-github-event'];
    const payload = req.body;

    if (event === 'push') {
      for (const commit of payload.commits || []) {
        const matches = (commit.message as string).match(/([A-Z]+-\d+)/g);
        if (!matches) continue;
        for (const taskNum of matches) {
          const task = await prisma.task.findFirst({ where: { taskNumber: taskNum } });
          if (!task) continue;
          await prisma.taskCommit.upsert({
            where: { repositoryId_commitSha: { repositoryId, commitSha: commit.id } },
            create: {
              repositoryId, taskId: task.id,
              commitSha: commit.id,
              message: commit.message,
              author: commit.author?.name || 'Unknown',
              committedAt: new Date(commit.timestamp),
            },
            update: {},
          });
        }
      }
    }
    res.json({ received: true });
  } catch {
    res.status(500).json({ message: 'Webhook error' });
  }
});

export default router;
