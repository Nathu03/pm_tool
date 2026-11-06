import { Controller, Post, Body, Headers, HttpCode } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private webhooks: WebhooksService) {}

  @Post('github') @HttpCode(200)
  github(@Body() body: any, @Headers('x-github-event') event: string) {
    if (event === 'push') return this.webhooks.handleGitHubPush(body);
    if (event === 'pull_request') return this.webhooks.handleGitHubPullRequest(body);
    return { received: true };
  }

  @Post('bitbucket') @HttpCode(200)
  bitbucket(@Body() body: any) { return { received: true }; }

  @Post('gitlab') @HttpCode(200)
  gitlab(@Body() body: any) { return { received: true }; }
}
