import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const BUSINESS_DAYS_ONLY = true;

function countDays(start: Date, end: Date): number {
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const dow = cur.getDay();
    if (!BUSINESS_DAYS_ONLY || (dow !== 0 && dow !== 6)) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

@Injectable()
export class LeaveService {
  constructor(private prisma: PrismaService) {}

  getPolicies() {
    return this.prisma.leavePolicy.findMany({ orderBy: { leaveType: 'asc' } });
  }

  upsertPolicy(leaveType: string, data: any) {
    return this.prisma.leavePolicy.upsert({
      where: { leaveType: leaveType as any },
      create: { leaveType: leaveType as any, ...data },
      update: data,
    });
  }

  async getBalance(userId: string, year?: number) {
    const y = year || new Date().getFullYear();
    const balances = await this.prisma.leaveBalance.findMany({
      where: { userId, year: y },
      include: { user: { select: { id: true, fullName: true, username: true } } },
    });
    const policies = await this.prisma.leavePolicy.findMany();
    const result: any[] = [...balances];
    for (const policy of policies) {
      if (!balances.find((b) => b.leaveType === policy.leaveType)) {
        result.push({ leaveType: policy.leaveType, allocated: policy.daysAllowedPerYear, used: 0, pending: 0, carryForward: 0, year: y, userId });
      }
    }
    return result;
  }

  async getAllBalances(year?: number) {
    const y = year || new Date().getFullYear();
    return this.prisma.leaveBalance.findMany({
      where: { year: y },
      include: { user: { select: { id: true, fullName: true, username: true, role: true } } },
      orderBy: [{ user: { fullName: 'asc' } }, { leaveType: 'asc' }],
    });
  }

  private async ensureBalance(userId: string, leaveType: string, year: number) {
    const policy = await this.prisma.leavePolicy.findUnique({ where: { leaveType: leaveType as any } });
    const allocated = policy?.daysAllowedPerYear ?? 0;
    return this.prisma.leaveBalance.upsert({
      where: { userId_leaveType_year: { userId, leaveType: leaveType as any, year } },
      create: { userId, leaveType: leaveType as any, year, allocated },
      update: {},
    });
  }

  async createRequest(userId: string, data: any) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (end < start) throw new BadRequestException('End date must be after start date');
    const days = countDays(start, end);
    if (days === 0) throw new BadRequestException('No working days in selected range');

    const year = start.getFullYear();
    const balance = await this.ensureBalance(userId, data.leaveType, year);
    const available = balance.allocated + balance.carryForward - balance.used - balance.pending;
    if (data.leaveType !== 'UNPAID' && available < days) {
      throw new BadRequestException(`Insufficient ${data.leaveType} leave balance. Available: ${available} days, Requested: ${days} days`);
    }

    const overlap = await this.prisma.leaveRequest.findFirst({
      where: {
        userId, deletedAt: null,
        status: { in: ['PENDING', 'APPROVED'] },
        OR: [
          { startDate: { lte: end }, endDate: { gte: start } },
        ],
      },
    });
    if (overlap) throw new BadRequestException('You already have a leave request overlapping these dates');

    const [request] = await this.prisma.$transaction([
      this.prisma.leaveRequest.create({
        data: { userId, leaveType: data.leaveType as any, startDate: start, endDate: end, days, reason: data.reason, handoverNote: data.handoverNote },
        include: { user: { select: { id: true, fullName: true, username: true } } },
      }),
      this.prisma.leaveBalance.update({
        where: { userId_leaveType_year: { userId, leaveType: data.leaveType as any, year } },
        data: { pending: { increment: days } },
      }),
    ]);
    return request;
  }

  findAll(filters?: any) {
    const where: any = { deletedAt: null };
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.status) where.status = filters.status;
    if (filters?.leaveType) where.leaveType = filters.leaveType;
    if (filters?.year) {
      const y = Number(filters.year);
      where.startDate = { gte: new Date(`${y}-01-01`) };
      where.endDate = { lte: new Date(`${y}-12-31`) };
    }
    return this.prisma.leaveRequest.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, username: true, role: true } },
        approver: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, username: true, role: true } },
        approver: { select: { id: true, fullName: true } },
      },
    });
  }

  async approve(id: string, approverId: string) {
    const req = await this.prisma.leaveRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException();
    if (req.status !== 'PENDING') throw new BadRequestException('Only PENDING requests can be approved');

    const year = req.startDate.getFullYear();
    const [updated] = await this.prisma.$transaction([
      this.prisma.leaveRequest.update({ where: { id }, data: { status: 'APPROVED', approverId } }),
      this.prisma.leaveBalance.update({
        where: { userId_leaveType_year: { userId: req.userId, leaveType: req.leaveType, year } },
        data: { used: { increment: req.days }, pending: { decrement: req.days } },
      }),
    ]);
    return updated;
  }

  async reject(id: string, approverId: string, rejectionNote: string) {
    const req = await this.prisma.leaveRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException();
    if (req.status !== 'PENDING') throw new BadRequestException('Only PENDING requests can be rejected');

    const year = req.startDate.getFullYear();
    const [updated] = await this.prisma.$transaction([
      this.prisma.leaveRequest.update({ where: { id }, data: { status: 'REJECTED', approverId, rejectionNote } }),
      this.prisma.leaveBalance.update({
        where: { userId_leaveType_year: { userId: req.userId, leaveType: req.leaveType, year } },
        data: { pending: { decrement: req.days } },
      }),
    ]);
    return updated;
  }

  async cancel(id: string, userId: string) {
    const req = await this.prisma.leaveRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException();
    if (req.userId !== userId) throw new ForbiddenException();
    if (!['PENDING', 'APPROVED'].includes(req.status)) throw new BadRequestException('Cannot cancel this request');

    const year = req.startDate.getFullYear();
    const data: any = { status: 'CANCELLED' };
    const balanceUpdate: any = {};
    if (req.status === 'PENDING') balanceUpdate.pending = { decrement: req.days };
    if (req.status === 'APPROVED') balanceUpdate.used = { decrement: req.days };

    const [updated] = await this.prisma.$transaction([
      this.prisma.leaveRequest.update({ where: { id }, data }),
      this.prisma.leaveBalance.update({
        where: { userId_leaveType_year: { userId: req.userId, leaveType: req.leaveType, year } },
        data: balanceUpdate,
      }),
    ]);
    return updated;
  }

  getCalendar(year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    return this.prisma.leaveRequest.findMany({
      where: { status: 'APPROVED', deletedAt: null, startDate: { lte: end }, endDate: { gte: start } },
      include: { user: { select: { id: true, fullName: true, username: true } } },
      orderBy: { startDate: 'asc' },
    });
  }

  getTeamSummary(year?: number) {
    const y = year || new Date().getFullYear();
    return this.prisma.leaveRequest.groupBy({
      by: ['userId', 'leaveType', 'status'],
      where: { startDate: { gte: new Date(`${y}-01-01`) }, endDate: { lte: new Date(`${y}-12-31`) }, deletedAt: null },
      _sum: { days: true },
      _count: { _all: true },
    });
  }
}
