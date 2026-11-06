import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any, ownerId: string) {
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').toUpperCase().slice(0, 6);
    return this.prisma.project.create({ data: { ...data, slug, members: { create: { userId: ownerId, role: 'OWNER' } } }, include: { _count: { select: { tasks: true, members: true } } } });
  }

  findAll(userId: string) {
    return this.prisma.project.findMany({
      where: { deletedAt: null, members: { some: { userId } } },
      include: { _count: { select: { tasks: true, members: true } } },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({ where: { id }, include: { members: { include: { user: true } } } });
    if (!project) throw new NotFoundException();
    return project;
  }

  addMember(projectId: string, userId: string, role = 'MEMBER') {
    return this.prisma.projectMember.create({ data: { projectId, userId, role } });
  }
}
