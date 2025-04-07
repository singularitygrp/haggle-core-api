import { Bot } from 'grammy';
import { ConfigService } from '@nestjs/config';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

@Injectable()
export class ChatService implements OnModuleInit {
  private readonly bot: Bot;
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly configService: ConfigService) {
    this.bot = new Bot(
      this.configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN'),
    );
  }

  async onModuleInit() {
    this.bot.start();
    const bot = await this.bot.api.getMe();
    this.logger.log(`${bot.first_name} bot is running`);
  }

  async sendMessage(userId: number, message: string) {
    await this.bot.api.sendMessage(userId, message);
  }
}
