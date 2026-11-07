import { Router, Response } from 'express';
import prisma from '../prisma';
import { requireAuth } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();
router.use(requireAuth);

function countBusinessDays(start: Date, end: Date): number {
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

router.get('/balance', async (req: AuthRequest, res: Response) => {
  const balances = await prisma.leaveBalance.findMany({
    where: { userId: req.user!.id },
  });
  res.json(balances);
});

router.get('/balance/all', async (_req, res: Response) => {
  const balances = await prisma.leaveBalance.findMany({
    include: { user: { select: { id: true, fullName: true, username: true, role: true } } },
  });
  res.json(balances);
});

router.get('/calendar', async (req: AuthRequest, res: Response) => {
  const { year, month } = req.query;
  const y = Number(year) || new Date().getFullYear();
  const m = Number(month) || new Date().getMonth() + 1;
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0);
  const events = await prisma.leaveRequest.findMany({
    where: { status: 'APPROVED', startDate: { lte: end }, endDate: { gte: start } },
    include: { user: { select: { id: true, fullName: true, avatarUrl: true } } },
    orderBy: { startDate: 'asc' },
  });
  res.json(events);
});

router.get('/team-summary', async (_req, res: Response) => {
  const summary = await prisma.leaveRequest.groupBy({
    by: ['userId', 'leaveType'],
    _sum: { days: true },
    where: { status: 'APPROVED' },
  });
  res.json(summary);
});

router.get('/dept-approvers/:userId', async (req, res: Response) => {
  const membership = await prisma.departmentMember.findFirst({
    where: { userId: req.params.userId },
    include: {
      department: {
        include: {
          leader: { select: { id: true, fullName: true } },
          subLeaders: { include: { user: { select: { id: true, fullName: true } } } },
        },
      },
    },
  });
  if (!membership) { res.json([]); return; }
  const approvers: any[] = [];
  if (membership.department.leader) approvers.push(membership.department.leader);
  for (const sl of membership.department.subLeaders) approvers.push(sl.user);
  res.json(approvers);
});

router.get('/policies', async (_req, res: Response) => {
  const policies = await prisma.leavePolicy.findMany();
  res.json(policies);
});

router.post('/policies/:type', async (req, res: Response) => {
  const { type } = req.params;
  const { maxDays, carryForward, requiresApproval } = req.body;
  const policy = await prisma.leavePolicy.upsert({
    where: { leaveType: type as any },
    create: { leaveType: type as any, maxDays, carryForward, requiresApproval },
    update: { maxDays, carryForward, requiresApproval },
  });
  res.json(policy);
});

router.get('/requests/my', async (req: AuthRequest, res: Response) => {
  const { status, leaveType, year } = req.query;
  const requests = await prisma.leaveRequest.findMany({
    where: {
      userId: req.user!.id,
      ...(status && { status: String(status) as any }),
      ...(leaveType && { leaveType: String(leaveType) as any }),
      ...(year && { startDate: { gte: new Date(`${year}-01-01`), lte: new Date(`${year}-12-31`) } }),
    },
    include: {
      approver: { select: { id: true, fullName: true } },
      backupEmployee: { select: { id: true, fullName: true } },
      user: { select: { id: true, fullName: true, username: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(requests);
});

router.get('/requests', async (_req, res: Response) => {
  const { status, leaveType, year, userId, approverId } = _req.query;
  const requests = await prisma.leaveRequest.findMany({
    where: {
      ...(status && { status: String(status) as any }),
      ...(leaveType && { leaveType: String(leaveType) as any }),
      ...(userId && { userId: String(userId) }),
      ...(approverId && { approverId: String(approverId) }),
      ...(year && { startDate: { gte: new Date(`${year}-01-01`), lte: new Date(`${year}-12-31`) } }),
    },
    include: {
      user: { select: { id: true, fullName: true, username: true, avatarUrl: true } },
      approver: { select: { id: true, fullName: true } },
      backupEmployee: { select: { id: true, fullName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(requests);
});

router.post('/requests', async (req: AuthRequest, res: Response) => {
  try {
    const { leaveType, startDate, endDate, reason, handoverNote, backupEmployeeId, backupNote } = req.body;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = countBusinessDays(start, end);

    let approverId: string | undefined;
    const membership = await prisma.departmentMember.findFirst({
      where: { userId: req.user!.id },
      include: { department: true },
    });
    if (membership?.department?.leaderId) approverId = membership.department.leaderId;

    const request = await prisma.leaveRequest.create({
      data: {
        userId: req.user!.id,
        leaveType, startDate: start, endDate: end, days, reason, handoverNote,
        backupEmployeeId: backupEmployeeId || undefined,
        backupNote: backupNote || undefined,
        approverId,
      },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
        approver: { select: { id: true, fullName: true } },
        backupEmployee: { select: { id: true, fullName: true } },
      },
    });
    res.status(201).json(request);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

router.patch('/requests/:id/approve', async (req: AuthRequest, res: Response) => {
  try {
    const request = await prisma.leaveRequest.findUnique({ where: { id: req.params.id } });
    if (!request) { res.status(404).json({ message: 'Not found' }); return; }
    const updated = await prisma.$transaction(async (tx) => {
      await tx.leaveBalance.updateMany({
        where: { userId: request.userId, leaveType: request.leaveType },
        data: { used: { increment: request.days }, remaining: { decrement: request.days } },
      });
      return tx.leaveRequest.update({
        where: { id: req.params.id },
        data: { status: 'APPROVED', approverId: req.user!.id, approvedAt: new Date(), approverNote: req.body.note },
        include: { user: { select: { id: true, fullName: true } } },
      });
    });
    res.json(updated);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

router.patch('/requests/:id/reject', async (req: AuthRequest, res: Response) => {
  const updated = await prisma.leaveRequest.update({
    where: { id: req.params.id },
    data: {
      status: 'REJECTED',
      approverId: req.user!.id,
      approvedAt: new Date(),
      approverNote: req.body.rejectionNote || req.body.note,
      rejectionNote: req.body.rejectionNote || req.body.note,
    },
  });
  res.json(updated);
});

router.patch('/requests/:id/cancel', async (_req, res: Response) => {
  const request = await prisma.leaveRequest.findUnique({ where: { id: _req.params.id } });
  if (!request) { res.status(404).json({ message: 'Not found' }); return; }
  if (request.status === 'APPROVED') {
    await prisma.$transaction(async (tx) => {
      await tx.leaveBalance.updateMany({
        where: { userId: request.userId, leaveType: request.leaveType },
        data: { used: { decrement: request.days }, remaining: { increment: request.days } },
      });
      await tx.leaveRequest.update({ where: { id: _req.params.id }, data: { status: 'CANCELLED' } });
    });
  } else {
    await prisma.leaveRequest.update({ where: { id: _req.params.id }, data: { status: 'CANCELLED' } });
  }
  res.json({ message: 'Cancelled' });
});

export default router;
