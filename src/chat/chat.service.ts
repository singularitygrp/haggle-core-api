import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { Bot } from 'grammy';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ChatService implements OnModuleInit, OnModuleDestroy {
  private readonly bot: Bot;
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly configService: ConfigService) {
    this.bot = new Bot(
      this.configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN'),
    );
  }

  async onModuleInit() {
    this.bot.start();
    this.bot.on('message', async (ctx) => {
      await this.sendMessage(ctx.message);
      this.logger.log(`${ctx.message.from.username} said: ${ctx.message.text}`);
    });
  }

  async sendMessage(message: any) {
    console.log(message);
    //await this.bot.api.sendMessage(userId, message);
  }

  async onModuleDestroy() {
    await this.bot.stop();
  }
}
