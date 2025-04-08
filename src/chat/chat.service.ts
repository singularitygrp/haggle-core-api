import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { Bot } from 'grammy';
import { ConfigService } from '@nestjs/config';

import { AiService } from '../ai/ai.service';
import { HumanMessage } from '@langchain/core/messages';

@Injectable()
export class ChatService implements OnModuleInit, OnModuleDestroy {
  private readonly bot: Bot;
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly aiService: AiService,
    private readonly configService: ConfigService,
  ) {
    this.bot = new Bot(
      this.configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN'),
    );
  }

  async onModuleInit() {
    this.bot.start();
    this.bot.on('message', async (ctx) => {
      //await this.sendMessage(ctx.message.text);
      await this.sendAltMessage(ctx.message.text);
      this.logger.log(`${ctx.message.from.username} said: ${ctx.message.text}`);
    });
  }

  async sendAltMessage(message: any) {
    const supervisor = this.aiService.getSupervisor();

    const stream = await supervisor.stream(
      { messages: [new HumanMessage(message)] },
      {
        streamMode: 'values',
        recursionLimit: 1000,
        configurable: { thread_id: 1 },
      },
    );

    for await (const { messages } of stream) {
      const msg = messages[messages?.length - 1];
      if (msg?.content) {
        console.log(msg.content);
      } else if (msg?.tool_calls?.length > 0) {
        console.log(msg.tool_calls);
      } else {
        console.log(msg);
      }
      console.log('-----\n');
    }
  }

  async sendMessage(message: any) {
    const priceFinder = this.aiService.getPriceFinder();

    const stream = await priceFinder.stream(
      { messages: [new HumanMessage(message)] },
      {
        configurable: { thread_id: 1 },
        streamMode: 'updates',
        recursionLimit: 1000,
        subgraphs: true,
      },
    );

    for await (const update of stream) {
      this.logger.debug(
        `\n----\nUPDATE: ${JSON.stringify(update, null, 2)}\n----\n`,
      );
    }
  }

  async onModuleDestroy() {
    await this.bot.stop();
  }
}
