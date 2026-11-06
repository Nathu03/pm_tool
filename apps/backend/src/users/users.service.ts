import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  create(data: any) {
    return this.prisma.user.create({ data: { email: data.email, username: data.username, fullName: data.fullName, passwordHash: data.passwordHash } });
  }
  findByEmail(email: string) { return this.prisma.user.findUnique({ where: { email, deletedAt: null } }); }
  findById(id: string) { return this.prisma.user.findUnique({ where: { id, deletedAt: null } }); }
  findAll(search?: string) {
    return this.prisma.user.findMany({
      where: { deletedAt: null, ...(search ? { OR: [{ fullName: { contains: search } }, { username: { contains: search } }] } : {}) },
      select: { id: true, email: true, username: true, fullName: true, role: true, avatarUrl: true, createdAt: true },
    });
  }
  updateRole(id: string, role: string) { return this.prisma.user.update({ where: { id }, data: { role: role as any } }); }
  deactivate(id: string) { return this.prisma.user.update({ where: { id }, data: { deletedAt: new Date() } }); }
}
