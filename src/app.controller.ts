import { ConfigService } from '@nestjs/config';
import { Controller, Get, Render } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private ConfigService: ConfigService, // Inject the ConfigService to access environment variables
  ) {}

  @Get()
  @Render('home')
  getHello() {
    // return 'this.appService.getHello()';
  }
}
