import { Injectable, Logger } from '@nestjs/common';

import { Supervisor, PriceFinder, store, checkpointer } from './agents';

@Injectable()
export class AiService {
  private readonly supervisor: Supervisor;
  private readonly priceFinder: PriceFinder;
  private readonly logger = new Logger(AiService.name);

  constructor() {
    this.supervisor = new Supervisor();
    this.priceFinder = new PriceFinder();
  }

  getPriceFinder() {
    const workflow = this.priceFinder.getWorkflow();
    return workflow.compile({
      checkpointer,
      store,
    });
  }

  getSupervisor() {
    const workflow = this.supervisor.getWorkflow();
    return workflow.compile({
      checkpointer,
      store,
    });
  }
}
