import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TasksService } from './tasks.service';

@UseGuards(AuthGuard('jwt'))
@Controller('projects/:projectId/tasks')
export class TasksController {
  constructor(private tasks: TasksService) {}
  @Post() create(@Param('projectId') pid: string, @Body() body: any, @Request() req) { return this.tasks.create(pid, body, req.user.id); }
  @Get() findAll(@Param('projectId') pid: string, @Query() query: any) { return this.tasks.findAll(pid, query); }
  @Get(':id') findOne(@Param('id') id: string) { return this.tasks.findOne(id); }
  @Patch(':id') update(@Param('projectId') pid: string, @Param('id') id: string, @Body() body: any, @Request() req) { return this.tasks.update(pid, id, body, req.user.id); }
  @Delete(':id') remove(@Param('id') id: string) { return this.tasks.remove(id); }
}
