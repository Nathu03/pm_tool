import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(userId: string, projectId?: string) {
    const where: any = { deletedAt: null, ...(projectId ? { projectId } : { project: { members: { some: { userId } } } }) };
    const [byStatus, overdue] = await Promise.all([
      this.prisma.task.groupBy({ by: ['status'], where, _count: { _all: true } }),
      this.prisma.task.count({ where: { ...where, dueDate: { lt: new Date() }, status: { notIn: ['COMPLETED', 'BACKLOG'] } } }),
    ]);
    const stats: any = { total: 0, overdue };
    for (const row of byStatus) { stats[row.status.toLowerCase().replace(/_([a-z])/g, (_: string, c: string) => c.toUpperCase())] = row._count._all; stats.total += row._count._all; }
    const teamPerformance = await this.prisma.user.findMany({
      where: { deletedAt: null, assignedTasks: { some: { task: where } } },
      select: { id: true, fullName: true, username: true, assignedTasks: { where: { task: where }, select: { task: { select: { status: true } } } } },
    });
    stats.teamPerformance = teamPerformance.map((u: any) => ({
      ...u,
      activeTasks: u.assignedTasks.length,
      inProgress: u.assignedTasks.filter((a: any) => a.task.status === 'IN_PROGRESS').length,
      assignedTasks: undefined,
    }));
    return stats;
  }
}
