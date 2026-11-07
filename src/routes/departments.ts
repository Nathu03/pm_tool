import { Router, Response } from 'express';
import prisma from '../prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/', async (_req, res: Response) => {
  const departments = await prisma.department.findMany({
    include: {
      leader: { select: { id: true, fullName: true, avatarUrl: true, role: true } },
      subLeaders: { include: { user: { select: { id: true, fullName: true, avatarUrl: true } } } },
      members: { include: { user: { select: { id: true, fullName: true, avatarUrl: true, role: true } } } },
    },
    orderBy: { name: 'asc' },
  });
  const shaped = departments.map((d) => ({
    ...d,
    lead: d.leader,
    members: d.members.map((m) => m.user),
  }));
  res.json(shaped);
});

router.post('/', async (req, res: Response) => {
  const { name, description, leaderId } = req.body;
  const dept = await prisma.department.create({
    data: { name, description, leaderId: leaderId || undefined },
    include: { leader: { select: { id: true, fullName: true } } },
  });
  res.status(201).json(dept);
});

router.patch('/:id', async (req, res: Response) => {
  const { name, description, leaderId } = req.body;
  const dept = await prisma.department.update({
    where: { id: req.params.id },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(leaderId !== undefined && { leaderId }),
    },
  });
  res.json(dept);
});

router.delete('/:id', async (req, res: Response) => {
  await prisma.department.delete({ where: { id: req.params.id } });
  res.json({ message: 'Deleted' });
});

router.post('/:id/members', async (req, res: Response) => {
  const { userId } = req.body;
  const member = await prisma.departmentMember.upsert({
    where: { departmentId_userId: { departmentId: req.params.id, userId } },
    create: { departmentId: req.params.id, userId },
    update: {},
  });
  res.status(201).json(member);
});

router.delete('/:id/members/:userId', async (req, res: Response) => {
  await prisma.departmentMember.delete({
    where: { departmentId_userId: { departmentId: req.params.id, userId: req.params.userId } },
  });
  res.json({ message: 'Removed' });
});

router.post('/:id/sub-leaders', async (req, res: Response) => {
  const { userId } = req.body;
  const sl = await prisma.departmentSubLeader.upsert({
    where: { departmentId_userId: { departmentId: req.params.id, userId } },
    create: { departmentId: req.params.id, userId },
    update: {},
  });
  res.status(201).json(sl);
});

router.delete('/:id/sub-leaders/:userId', async (req, res: Response) => {
  await prisma.departmentSubLeader.delete({
    where: { departmentId_userId: { departmentId: req.params.id, userId: req.params.userId } },
  });
  res.json({ message: 'Removed' });
});

export default router;
