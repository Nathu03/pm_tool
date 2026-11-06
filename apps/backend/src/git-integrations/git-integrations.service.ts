import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GitIntegrationsService {
  constructor(private prisma: PrismaService) {}

  addRepository(projectId: string, data: any) {
    return this.prisma.repository.create({
      data: { ...data, projectId },
      include: { project: { select: { id: true, name: true, slug: true } } },
    });
  }

  linkBranch(taskId: string, repositoryId: string, branchName: string) {
    return this.prisma.taskBranch.upsert({
      where: { taskId_branchName: { taskId, branchName } },
      create: { taskId, repositoryId, branchName },
      update: {},
      include: { task: { select: { taskNumber: true, title: true } } },
    });
  }

  recordCommit(taskId: string, repositoryId: string, data: any) {
    return this.prisma.taskCommit.create({ data: { taskId, repositoryId, ...data } });
  }

  extractTaskNumberFromMessage(message: string): string | null {
    const match = message.match(/([A-Z]{2,10}-\d+)/i);
    return match ? match[1].toUpperCase() : null;
  }

  findRepositoriesByProject(projectId: string) {
    return this.prisma.repository.findMany({
      where: { projectId },
      include: { project: { select: { id: true, name: true, slug: true } } },
    });
  }

  findAllRepositoriesForUser(userId: string) {
    return this.prisma.repository.findMany({
      where: { project: { members: { some: { userId } } } },
      include: { project: { select: { id: true, name: true, slug: true } } },
    });
  }

  async getRepositoryDetail(repositoryId: string) {
    const [repo, branches, commits, pullRequests] = await Promise.all([
      this.prisma.repository.findUnique({
        where: { id: repositoryId },
        include: { project: { select: { id: true, name: true, slug: true } } },
      }),
      this.prisma.taskBranch.findMany({
        where: { repositoryId },
        include: { task: { select: { id: true, taskNumber: true, title: true, status: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.taskCommit.findMany({
        where: { repositoryId },
        include: { task: { select: { id: true, taskNumber: true, title: true } } },
        orderBy: { committedAt: 'desc' },
        take: 30,
      }),
      this.prisma.pullRequest.findMany({
        where: { repositoryId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);
    return { ...repo, branches, commits, pullRequests };
  }
}
