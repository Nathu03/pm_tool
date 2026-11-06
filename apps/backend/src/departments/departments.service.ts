import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.department.findMany({
      include: {
        lead: { select: { id: true, fullName: true, username: true } },
        subLeaders: { include: { user: { select: { id: true, fullName: true, username: true } } } },
        members: { select: { id: true, fullName: true, username: true, role: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.department.findUnique({
      where: { id },
      include: {
        lead: { select: { id: true, fullName: true, username: true } },
        subLeaders: { include: { user: { select: { id: true, fullName: true, username: true } } } },
        members: { select: { id: true, fullName: true, username: true, role: true } },
      },
    });
  }

  create(data: any) {
    return this.prisma.department.create({
      data: { name: data.name, description: data.description, leaderId: data.leaderId },
    });
  }

  async update(id: string, data: any) {
    const dept = await this.prisma.department.findUnique({ where: { id } });
    if (!dept) throw new NotFoundException();
    const updates: any = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.description !== undefined) updates.description = data.description;
    if (data.leaderId !== undefined) updates.leaderId = data.leaderId;
    return this.prisma.department.update({ where: { id }, data: updates });
  }

  async addSubLeader(id: string, userId: string) {
    return this.prisma.departmentSubLeader.upsert({
      where: { departmentId_userId: { departmentId: id, userId } },
      create: { departmentId: id, userId },
      update: {},
    });
  }

  async removeSubLeader(id: string, userId: string) {
    return this.prisma.departmentSubLeader.delete({
      where: { departmentId_userId: { departmentId: id, userId } },
    });
  }

  async addMember(id: string, userId: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { departmentId: id } });
  }

  async removeMember(userId: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { departmentId: null } });
  }

  async delete(id: string) {
    return this.prisma.department.delete({ where: { id } });
  }
}
