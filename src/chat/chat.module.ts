import { Module } from '@nestjs/common';

import { ChatService } from './chat.service';
import { AiService } from 'src/ai/ai.service';

@Module({
  providers: [ChatService, AiService],
})
export class ChatModule {}
