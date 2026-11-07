import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import { requireAuth } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();
const SECRET = process.env.JWT_SECRET || 'secret';

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, username, role } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) { res.status(409).json({ message: 'Email already in use' }); return; }
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hash, fullName, username: username || email.split('@')[0], role: role || 'DEVELOPER' },
      select: { id: true, email: true, fullName: true, username: true, role: true, createdAt: true },
    });
    const accessToken = jwt.sign({ id: user.id, email: user.email, role: user.role, fullName: user.fullName }, SECRET, { expiresIn: '7d' });
    res.status(201).json({ user, accessToken });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) { res.status(401).json({ message: 'Invalid credentials' }); return; }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) { res.status(401).json({ message: 'Invalid credentials' }); return; }
    const accessToken = jwt.sign({ id: user.id, email: user.email, role: user.role, fullName: user.fullName }, SECRET, { expiresIn: '7d' });
    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser, accessToken });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, fullName: true, username: true, role: true, createdAt: true, avatarUrl: true },
    });
    res.json(user);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
