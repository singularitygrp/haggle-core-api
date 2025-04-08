import { z } from 'zod';
import {
  START,
  StateGraph,
  MessagesAnnotation,
  Command,
} from '@langchain/langgraph';
import { initChatModel } from 'langchain/chat_models/universal';
import { HumanMessage } from '@langchain/core/messages';

import { PriceFinder } from './price-finder';
import { store, checkpointer } from './memory';

export class Supervisor {
  private readonly priceFinder: PriceFinder;

  constructor() {
    this.priceFinder = new PriceFinder();
  }

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

  private createPriceFinder = async (
    state: typeof MessagesAnnotation.State,
  ) => {
    const priceFinder = new PriceFinder();
    const workflow = priceFinder.getWorkflow().compile({
      checkpointer,
      store,
    });

    const lastMessage = state.messages[state.messages.length - 1];

    const response = await workflow.invoke({
      messages: [new HumanMessage(lastMessage.content as string)],
    });

    return new Command({
      goto: 'supervisor',
      update: {
        messages: response.messages,
      },
    });
  };

  private async createSupervisor(state: typeof MessagesAnnotation.State) {
    const model = await initChatModel('gpt-4o-mini', {
      temperature: 0,
    });

    const systemPrompt = `You are a supervisor agent that determines which specialized agent should handle a user query.
    Available agents:
    - agent1: General conversation
    - agent2: General information
    - price_finder: For any requests related to finding products or prices
    - __end__: If the conversation should end

    Select the most appropriate agent based on the user's latest message.`;

    const response = await model
      .withStructuredOutput(
        z.object({
          next_agent: z.enum(['agent1', 'agent2', 'price_finder', '__end__']),
        }),
      )
      .invoke([{ role: 'system', content: systemPrompt }, ...state.messages]);

    return new Command({
      goto: response.next_agent,
    });
  }

  getWorkflow() {
    return new StateGraph(MessagesAnnotation)
      .addNode('supervisor', this.createSupervisor, {
        ends: ['agent1', 'agent2', 'price_finder', '__end__'],
      })
      .addNode('agent1', this.createAgentOne, {
        ends: ['supervisor'],
      })
      .addNode('agent2', this.createAgentTwo, {
        ends: ['supervisor'],
      })
      .addNode('price_finder', this.createPriceFinder, {
        ends: ['supervisor'],
      })
      .addEdge(START, 'supervisor')
      .compile();
  }
}
