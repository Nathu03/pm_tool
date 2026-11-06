import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';

@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}
  @Get() findAll(@Query('search') search?: string) { return this.users.findAll(search); }
  @Post() create(@Body() body: any) { return this.users.createByAdmin(body); }
  @Patch(':id/role') updateRole(@Param('id') id: string, @Body() body: any) { return this.users.updateRole(id, body.role); }
  @Delete(':id') deactivate(@Param('id') id: string) { return this.users.deactivate(id); }
}
