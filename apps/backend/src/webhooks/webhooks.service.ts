import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GitIntegrationsService } from '../git-integrations/git-integrations.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private prisma: PrismaService, private git: GitIntegrationsService) {}

  async handleGitHubPush(payload: any) {
    const repoUrl = payload.repository?.html_url;
    if (!repoUrl) return;
    const repo = await this.prisma.repository.findFirst({ where: { cloneUrl: repoUrl }, include: { project: true } });
    if (!repo) return;
    for (const commit of payload.commits || []) {
      const taskNumber = this.git.extractTaskIdFromCommit(commit.message, repo.project.slug);
      if (!taskNumber) continue;
      const task = await this.prisma.task.findFirst({ where: { taskNumber, projectId: repo.projectId } });
      if (!task) continue;
      await this.git.linkBranch(task.id, repo.id, payload.ref?.replace('refs/heads/', '') || 'unknown');
      await this.git.recordCommit(task.id, repo.id, { sha: commit.id, message: commit.message, authorName: commit.author?.name, authorEmail: commit.author?.email, committedAt: new Date(commit.timestamp) });
    }
  }

  async handleGitHubPullRequest(payload: any) {
    const pr = payload.pull_request;
    if (!pr) return;
    const repoUrl = payload.repository?.html_url;
    const repo = await this.prisma.repository.findFirst({ where: { cloneUrl: repoUrl } });
    if (!repo) return;
    await this.prisma.pullRequest.upsert({ where: { repositoryId_prNumber: { repositoryId: repo.id, prNumber: pr.number } }, create: { repositoryId: repo.id, prNumber: pr.number, title: pr.title, url: pr.html_url, state: pr.state, sourceBranch: pr.head.ref, targetBranch: pr.base.ref }, update: { state: pr.state, title: pr.title } });
  }
}
