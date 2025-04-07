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
      await this.sendMessage(ctx.message.text);
      this.logger.log(`${ctx.message.from.username} said: ${ctx.message.text}`);
    });
  }

  async sendMessage(message: any) {
    console.log(message);
    const priceFinder = this.aiService.getPriceFinder();
    // const agentFinalState = await priceFinder.invoke(
    //   { messages: [new HumanMessage(message)] },
    //   { configurable: { thread_id: 1 } },
    // );
    const stream = await priceFinder.stream(
      { messages: [new HumanMessage(message)] },
      {
        recursionLimit: 100,
        configurable: { thread_id: 1 },
        streamMode: 'updates',
        subgraphs: true,
      },
    );
    for await (const update of stream) {
      console.log(`\n----\nUPDATE: ${JSON.stringify(update, null, 2)}\n----\n`);
    }
    // console.log('agentFinalState', agentFinalState);
    //await this.bot.api.sendMessage(userId, message);
  }

  async onModuleDestroy() {
    await this.bot.stop();
  }
}
