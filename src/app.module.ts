import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AiModule } from './ai/ai.module';
import { AppService } from './app.service';
import { ChatModule } from './chat/chat.module';
import { CommerceModule } from './commerce/commerce.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AiModule,
    ChatModule,
    CommerceModule,
  ],
  controllers: [],
  providers: [AppService],
})
export class AppModule {}
