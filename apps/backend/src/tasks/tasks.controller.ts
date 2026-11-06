import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TasksService } from './tasks.service';

@UseGuards(AuthGuard('jwt'))
@Controller()
export class TasksController {
  constructor(private tasks: TasksService) {}

  @Post('projects/:projectId/tasks')
  create(@Param('projectId') pid: string, @Body() body: any, @Request() req: any) { return this.tasks.create(pid, body, req.user.id); }

  @Get('projects/:projectId/tasks')
  findAll(@Param('projectId') pid: string, @Query() query: any) { return this.tasks.findAll(pid, query); }

  @Get('tasks/:id')
  findOne(@Param('id') id: string) { return this.tasks.findOne(id); }

  @Patch('projects/:projectId/tasks/:id')
  update(@Param('projectId') pid: string, @Param('id') id: string, @Body() body: any, @Request() req: any) { return this.tasks.update(pid, id, body, req.user.id); }

  @Delete('projects/:projectId/tasks/:id')
  remove(@Param('id') id: string) { return this.tasks.remove(id); }
}
