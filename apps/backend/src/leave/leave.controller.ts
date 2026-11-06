import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LeaveService } from './leave.service';

@UseGuards(AuthGuard('jwt'))
@Controller('leave')
export class LeaveController {
  constructor(private leave: LeaveService) {}

  @Get('policies') getPolicies() { return this.leave.getPolicies(); }
  @Post('policies/:type') upsertPolicy(@Param('type') type: string, @Body() body: any) { return this.leave.upsertPolicy(type, body); }

  @Get('balance') getMyBalance(@Request() req: any, @Query('year') year?: string) { return this.leave.getBalance(req.user.id, year ? Number(year) : undefined); }
  @Get('balance/all') getAllBalances(@Query('year') year?: string) { return this.leave.getAllBalances(year ? Number(year) : undefined); }
  @Get('balance/:userId') getUserBalance(@Param('userId') userId: string, @Query('year') year?: string) { return this.leave.getBalance(userId, year ? Number(year) : undefined); }

  @Post('requests') create(@Request() req: any, @Body() body: any) { return this.leave.createRequest(req.user.id, body); }
  @Get('requests') findAll(@Query() query: any) { return this.leave.findAll(query); }
  @Get('requests/my') findMy(@Request() req: any, @Query() query: any) { return this.leave.findAll({ ...query, userId: req.user.id }); }
  @Get('requests/:id') findOne(@Param('id') id: string) { return this.leave.findOne(id); }
  @Patch('requests/:id/approve') approve(@Param('id') id: string, @Request() req: any) { return this.leave.approve(id, req.user.id); }
  @Patch('requests/:id/reject') reject(@Param('id') id: string, @Request() req: any, @Body() body: any) { return this.leave.reject(id, req.user.id, body.rejectionNote); }
  @Patch('requests/:id/cancel') cancel(@Param('id') id: string, @Request() req: any) { return this.leave.cancel(id, req.user.id); }

  @Get('calendar') getCalendar(@Query('year') year: string, @Query('month') month: string) { return this.leave.getCalendar(Number(year) || new Date().getFullYear(), Number(month) || new Date().getMonth() + 1); }
  @Get('team-summary') getTeamSummary(@Query('year') year?: string) { return this.leave.getTeamSummary(year ? Number(year) : undefined); }
}
