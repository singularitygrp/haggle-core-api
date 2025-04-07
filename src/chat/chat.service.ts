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
      const message = ctx.message;
      this.logger.log(`${message.from.username} said: ${message.text}`);
    });
  }

  async sendMessage(userId: number, message: string) {
    await this.bot.api.sendMessage(userId, message);
  }

  async onModuleDestroy() {
    await this.bot.stop();
  }
}
