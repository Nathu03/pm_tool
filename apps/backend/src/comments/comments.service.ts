import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  create(taskId: string, authorId: string, body: string, parentId?: string) {
    return this.prisma.taskComment.create({ data: { taskId, authorId, body, parentId }, include: { author: true } });
  }

  async update(id: string, userId: string, body: string) {
    const comment = await this.prisma.taskComment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException();
    if (comment.authorId !== userId) throw new ForbiddenException();
    return this.prisma.taskComment.update({ where: { id }, data: { body, editedAt: new Date() } });
  }

  async remove(id: string, userId: string) {
    const comment = await this.prisma.taskComment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException();
    if (comment.authorId !== userId) throw new ForbiddenException();
    return this.prisma.taskComment.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
