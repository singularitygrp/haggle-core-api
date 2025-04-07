import { Injectable, Logger } from '@nestjs/common';

import { PriceFinder } from './agents';

@Injectable()
export class AiService {
  private readonly priceFinder: PriceFinder;
  private readonly logger = new Logger(AiService.name);

  constructor() {
    this.priceFinder = new PriceFinder();
  }

  getPriceFinder() {
    return this.priceFinder.getWorkflow();
  }
}
