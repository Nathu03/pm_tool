import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const STATUS_TRANSITIONS: Record<string, string[]> = {
  BACKLOG: ['TODO'],
  TODO: ['IN_PROGRESS', 'BACKLOG'],
  IN_PROGRESS: ['UAT', 'TODO', 'BLOCKED'],
  UAT: ['AI_REVIEW', 'IN_PROGRESS'],
  AI_REVIEW: ['QA_BA_REVIEW', 'IN_PROGRESS'],
  QA_BA_REVIEW: ['COMPLETED', 'IN_PROGRESS'],
  COMPLETED: ['REOPENED'],
  BLOCKED: ['IN_PROGRESS'],
  REOPENED: ['TODO'],
};

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService, private notifications: NotificationsService) {}

  private async generateTaskNumber(projectId: string): Promise<string> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    const count = await this.prisma.task.count({ where: { projectId } });
    return `${project.slug}-${count + 1}`;
  }

  async create(projectId: string, data: any, creatorId: string) {
    const taskNumber = await this.generateTaskNumber(projectId);
    const { assigneeIds, ...rest } = data;
    const task = await this.prisma.task.create({
      data: { ...rest, taskNumber, projectId, creatorId, ...(assigneeIds?.length ? { assignees: { create: assigneeIds.map((userId: string) => ({ userId })) } } : {}) },
      include: { assignees: { include: { user: true } }, creator: true },
    });
    await this.logActivity(task.id, creatorId, 'CREATED', {});
    return task;
  }

  findAll(projectId: string, filters?: any) {
    return this.prisma.task.findMany({
      where: { projectId, deletedAt: null, ...(filters?.status ? { status: filters.status } : {}), ...(filters?.assigneeId ? { assignees: { some: { userId: filters.assigneeId } } } : {}) },
      include: { assignees: { include: { user: true } }, labels: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.task.findUnique({
      where: { id },
      include: { assignees: { include: { user: true } }, comments: { where: { deletedAt: null, parentId: null }, include: { author: true, replies: { include: { author: true } } } }, branches: true, commits: { orderBy: { committedAt: 'desc' }, take: 10 }, aiReviews: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
  }

  async update(projectId: string, id: string, data: any, userId: string) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException();
    if (data.status && data.status !== task.status) {
      const allowed = STATUS_TRANSITIONS[task.status] || [];
      if (!allowed.includes(data.status)) throw new BadRequestException(`Cannot transition from ${task.status} to ${data.status}`);
      await this.logActivity(id, userId, 'STATUS_CHANGED', { from: task.status, to: data.status });
    }
    return this.prisma.task.update({ where: { id }, data, include: { assignees: { include: { user: true } } } });
  }

  async remove(id: string) {
    return this.prisma.task.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  logActivity(taskId: string, userId: string, action: string, metadata: any) {
    return this.prisma.taskActivityLog.create({ data: { taskId, userId, action, metadata } });
  }
}
