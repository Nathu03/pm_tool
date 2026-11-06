import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GitIntegrationsService } from '../git-integrations/git-integrations.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private prisma: PrismaService, private git: GitIntegrationsService) {}

  private async findRepoByUrl(url: string) {
    if (!url) return null;
    return this.prisma.repository.findFirst({
      where: { OR: [{ cloneUrl: url }, { webUrl: url }, { cloneUrl: url.replace(/\.git$/, '') }, { webUrl: url + '.git' }] },
      include: { project: true },
    });
  }

  private async processCommit(
    commit: { id: string; message: string; author?: any; timestamp?: string },
    repo: any,
    branchName: string,
  ) {
    const taskNumber = this.git.extractTaskNumberFromMessage(commit.message);
    if (!taskNumber) return;
    const task = await this.prisma.task.findFirst({ where: { taskNumber, projectId: repo.projectId, deletedAt: null } });
    if (!task) return;
    await this.git.linkBranch(task.id, repo.id, branchName);
    try {
      await this.git.recordCommit(task.id, repo.id, {
        sha: commit.id,
        message: commit.message,
        authorName: commit.author?.name || commit.author?.username,
        authorEmail: commit.author?.email,
        committedAt: commit.timestamp ? new Date(commit.timestamp) : new Date(),
      });
    } catch { /* duplicate sha — ignore */ }
    this.logger.log(`Linked commit ${commit.id?.slice(0, 7)} to task ${taskNumber}`);
  }

  async handleGitHubPush(payload: any) {
    const repoUrl = payload.repository?.html_url || payload.repository?.clone_url;
    const repo = await this.findRepoByUrl(repoUrl);
    if (!repo) { this.logger.warn(`No repo found for ${repoUrl}`); return { received: true }; }
    const branchName = (payload.ref || '').replace('refs/heads/', '') || repo.defaultBranch;
    for (const commit of payload.commits || []) await this.processCommit(commit, repo, branchName);
    return { received: true, processed: payload.commits?.length || 0 };
  }

  async handleGitHubPullRequest(payload: any) {
    const pr = payload.pull_request;
    if (!pr) return { received: true };
    const repo = await this.findRepoByUrl(payload.repository?.html_url);
    if (!repo) return { received: true };
    await this.prisma.pullRequest.upsert({
      where: { repositoryId_prNumber: { repositoryId: repo.id, prNumber: pr.number } },
      create: { repositoryId: repo.id, prNumber: pr.number, title: pr.title, url: pr.html_url, state: pr.state, sourceBranch: pr.head?.ref || '', targetBranch: pr.base?.ref || 'main' },
      update: { state: pr.state, title: pr.title },
    });
    return { received: true };
  }

  async handleBitbucketPush(payload: any) {
    const repoUrl = payload.repository?.links?.html?.href || payload.repository?.full_name;
    const repo = repoUrl ? await this.findRepoByUrl(repoUrl) : null;
    if (!repo) return { received: true };
    for (const change of payload.push?.changes || []) {
      const branchName = change.new?.name || repo.defaultBranch;
      for (const commit of change.commits || []) {
        await this.processCommit({ id: commit.hash, message: commit.message, author: commit.author, timestamp: commit.date }, repo, branchName);
      }
    }
    return { received: true };
  }

  async handleBitbucketPR(payload: any) {
    const pr = payload.pullrequest;
    if (!pr) return { received: true };
    const repoUrl = payload.repository?.links?.html?.href;
    const repo = repoUrl ? await this.findRepoByUrl(repoUrl) : null;
    if (!repo) return { received: true };
    await this.prisma.pullRequest.upsert({
      where: { repositoryId_prNumber: { repositoryId: repo.id, prNumber: pr.id } },
      create: { repositoryId: repo.id, prNumber: pr.id, title: pr.title, url: pr.links?.html?.href, state: 'open', sourceBranch: pr.source?.branch?.name || '', targetBranch: pr.destination?.branch?.name || 'main' },
      update: { state: payload.event?.includes('fulfilled') ? 'merged' : 'open', title: pr.title },
    });
    return { received: true };
  }

  async handleGitLabPush(payload: any) {
    const repoUrl = payload.repository?.homepage || payload.project?.web_url;
    const repo = repoUrl ? await this.findRepoByUrl(repoUrl) : null;
    if (!repo) return { received: true };
    const branchName = (payload.ref || '').replace('refs/heads/', '') || repo.defaultBranch;
    for (const commit of payload.commits || []) {
      await this.processCommit({ id: commit.id, message: commit.message, author: commit.author, timestamp: commit.timestamp }, repo, branchName);
    }
    return { received: true };
  }

  async handleGitLabMR(payload: any) {
    const mr = payload.object_attributes;
    if (!mr) return { received: true };
    const repo = await this.findRepoByUrl(payload.project?.web_url);
    if (!repo) return { received: true };
    await this.prisma.pullRequest.upsert({
      where: { repositoryId_prNumber: { repositoryId: repo.id, prNumber: mr.iid } },
      create: { repositoryId: repo.id, prNumber: mr.iid, title: mr.title, url: mr.url, state: mr.state, sourceBranch: mr.source_branch || '', targetBranch: mr.target_branch || 'main' },
      update: { state: mr.state, title: mr.title },
    });
    return { received: true };
  }
}
