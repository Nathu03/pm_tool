import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}
  create(data: { userId: string; type: string; title: string; body: string; taskId?: string }) {
    return this.prisma.notification.create({ data: data as any });
  }
  findByUser(userId: string) { return this.prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 50 }); }
  markRead(id: string) { return this.prisma.notification.update({ where: { id }, data: { readAt: new Date() } }); }
  markAllRead(userId: string) { return this.prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } }); }
}
