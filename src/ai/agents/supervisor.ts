import { z } from 'zod';
import {
  START,
  StateGraph,
  MessagesAnnotation,
  Command,
} from '@langchain/langgraph';
import { initChatModel } from 'langchain/chat_models/universal';

import { PriceFinder } from './price-finder';

export class Supervisor {
  private async createAgentOne(state: typeof MessagesAnnotation.State) {
    const model = await initChatModel('gpt-4o-mini', {
      temperature: 0,
    });

    const response = await model.invoke(state.messages);
    return new Command({
      goto: 'supervisor',
      update: {
        messages: [response],
      },
    });
  }

  private async createAgentTwo(state: typeof MessagesAnnotation.State) {
    const model = await initChatModel('gpt-4o-mini', {
      temperature: 0,
    });

    const response = await model.invoke(state.messages);
    return new Command({
      goto: 'supervisor',
      update: {
        messages: [response],
      },
    });
  }

  private async createSupervisor(state: typeof MessagesAnnotation.State) {
    const model = await initChatModel('gpt-4o-mini', {
      temperature: 0,
    });

    const response = await model
      .withStructuredOutput(
        z.object({
          next_agent: z.enum(['agent1', 'agent2', '__end__']),
        }),
      )
      .invoke(state.messages);
    return new Command({
      goto: response.next_agent,
    });
  }

  getWorkflow() {
    const agent1 = this.createAgentOne;
    const agent2 = this.createAgentTwo;
    const supervisor = this.createSupervisor;

    return new StateGraph(MessagesAnnotation)
      .addNode('supervisor', supervisor, {
        ends: ['agent1', 'agent2', '__end__'],
      })
      .addNode('agent1', agent1, {
        ends: ['supervisor'],
      })
      .addNode('agent2', agent2, {
        ends: ['supervisor'],
      })
      .addEdge(START, 'supervisor')
      .compile();
  }
}
