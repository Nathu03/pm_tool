import { Router, Response } from 'express';
import prisma from '../prisma';
import { requireAuth } from '../middleware/auth';
import { AuthRequest } from '../types';
import bcrypt from 'bcryptjs';

const router = Router();
router.use(requireAuth);

const USER_SELECT = { id: true, email: true, fullName: true, username: true, role: true, avatarUrl: true, isActive: true, createdAt: true };

router.get('/', async (_req, res: Response) => {
  const users = await prisma.user.findMany({ select: USER_SELECT, orderBy: { fullName: 'asc' } });
  res.json(users);
});

router.post('/', async (req, res: Response) => {
  try {
    const { email, password, fullName, username, role } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hash, fullName, username: username || email.split('@')[0], role: role || 'DEVELOPER' },
      select: USER_SELECT,
    });
    res.status(201).json(user);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

router.get('/:id', async (req, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id }, select: USER_SELECT });
  if (!user) { res.status(404).json({ message: 'Not found' }); return; }
  res.json(user);
});

router.patch('/:id', async (req, res: Response) => {
  const { fullName, email, password, avatarUrl } = req.body;
  const data: any = {};
  if (fullName) data.fullName = fullName;
  if (email) data.email = email;
  if (avatarUrl !== undefined) data.avatarUrl = avatarUrl;
  if (password) data.password = await bcrypt.hash(password, 10);
  const user = await prisma.user.update({ where: { id: req.params.id }, data, select: USER_SELECT });
  res.json(user);
});

router.patch('/:id/role', async (req, res: Response) => {
  const { role } = req.body;
  const user = await prisma.user.update({ where: { id: req.params.id }, data: { role }, select: USER_SELECT });
  res.json(user);
});

router.delete('/:id', async (req, res: Response) => {
  await prisma.user.update({ where: { id: req.params.id }, data: { isActive: false } });
  res.json({ message: 'Deactivated' });
});

export default router;
