import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GitIntegrationsService } from './git-integrations.service';

@UseGuards(AuthGuard('jwt'))
@Controller()
export class GitIntegrationsController {
  constructor(private git: GitIntegrationsService) {}

  @Post('projects/:projectId/repositories')
  add(@Param('projectId') projectId: string, @Body() body: any) {
    return this.git.addRepository(projectId, body);
  }

  @Get('projects/:projectId/repositories')
  listByProject(@Param('projectId') projectId: string) {
    return this.git.findRepositoriesByProject(projectId);
  }

  @Get('repositories')
  listAll(@Request() req: any) {
    return this.git.findAllRepositoriesForUser(req.user.id);
  }

  @Get('repositories/:id')
  getDetail(@Param('id') id: string) {
    return this.git.getRepositoryDetail(id);
  }

  @Post('repositories/:id/branches')
  linkBranch(@Param('id') repositoryId: string, @Body() body: any) {
    return this.git.linkBranch(body.taskId, repositoryId, body.branchName);
  }
}
