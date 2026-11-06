import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DepartmentsService } from './departments.service';

@UseGuards(AuthGuard('jwt'))
@Controller('departments')
export class DepartmentsController {
  constructor(private depts: DepartmentsService) {}

  @Get()      findAll() { return this.depts.findAll(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.depts.findOne(id); }
  @Post()     create(@Body() body: any) { return this.depts.create(body); }
  @Patch(':id') update(@Param('id') id: string, @Body() body: any) { return this.depts.update(id, body); }
  @Delete(':id') remove(@Param('id') id: string) { return this.depts.delete(id); }

  @Post(':id/sub-leaders')         addSubLeader(@Param('id') id: string, @Body() b: any) { return this.depts.addSubLeader(id, b.userId); }
  @Delete(':id/sub-leaders/:uid') removeSubLeader(@Param('id') id: string, @Param('uid') uid: string) { return this.depts.removeSubLeader(id, uid); }
  @Post(':id/members')            addMember(@Param('id') id: string, @Body() b: any) { return this.depts.addMember(id, b.userId); }
  @Delete(':id/members/:uid')     removeMember(@Param('id') id: string, @Param('uid') uid: string) { return this.depts.removeMember(uid); }
}
