import { Injectable, Logger } from '@nestjs/common';

import { Supervisor } from './agents';

@Injectable()
export class AiService {
  private readonly supervisor: Supervisor;
  private readonly logger = new Logger(AiService.name);

  constructor() {
    this.supervisor = new Supervisor();
  }

  getSupervisor() {
    return this.supervisor.getWorkflow();
  }
}
