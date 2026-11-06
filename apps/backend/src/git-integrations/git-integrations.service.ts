import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GitIntegrationsService {
  constructor(private prisma: PrismaService) {}

  addRepository(projectId: string, data: any) {
    return this.prisma.repository.create({ data: { ...data, projectId } });
  }

  linkBranch(taskId: string, repositoryId: string, branchName: string) {
    return this.prisma.taskBranch.upsert({ where: { taskId_branchName: { taskId, branchName } }, create: { taskId, repositoryId, branchName }, update: {} });
  }

  recordCommit(taskId: string, repositoryId: string, data: any) {
    return this.prisma.taskCommit.create({ data: { taskId, repositoryId, ...data } });
  }

  extractTaskIdFromCommit(message: string, projectSlug: string): string | null {
    const match = message.match(new RegExp(`${projectSlug}-(\\d+)`, 'i'));
    return match ? match[0].toUpperCase() : null;
  }

  findRepositoriesByProject(projectId: string) {
    return this.prisma.repository.findMany({ where: { projectId } });
  }
}
