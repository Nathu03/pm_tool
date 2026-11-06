import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DashboardService } from './dashboard.service';

@UseGuards(AuthGuard('jwt'))
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboard: DashboardService) {}
  @Get('stats') getStats(@Request() req, @Query('projectId') projectId?: string) { return this.dashboard.getStats(req.user.id, projectId); }
}
