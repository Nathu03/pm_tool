import { Controller, Post, Body, Headers, HttpCode } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private webhooks: WebhooksService) {}

  @Post('github')
  @HttpCode(200)
  github(@Body() body: any, @Headers('x-github-event') event: string) {
    if (event === 'push') return this.webhooks.handleGitHubPush(body);
    if (event === 'pull_request') return this.webhooks.handleGitHubPullRequest(body);
    return { received: true, event };
  }

  @Post('bitbucket')
  @HttpCode(200)
  bitbucket(@Body() body: any, @Headers('x-event-key') event: string) {
    if (event === 'repo:push') return this.webhooks.handleBitbucketPush(body);
    if (event?.startsWith('pullrequest:')) return this.webhooks.handleBitbucketPR(body);
    return { received: true, event };
  }

  @Post('gitlab')
  @HttpCode(200)
  gitlab(@Body() body: any, @Headers('x-gitlab-event') event: string) {
    if (event === 'Push Hook' || event === 'Tag Push Hook') return this.webhooks.handleGitLabPush(body);
    if (event === 'Merge Request Hook') return this.webhooks.handleGitLabMR(body);
    return { received: true, event };
  }
}
