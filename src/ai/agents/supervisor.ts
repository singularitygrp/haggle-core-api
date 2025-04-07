import { z } from 'zod';
import { tool } from '@langchain/core/tools';
import { initChatModel } from 'langchain/chat_models/universal';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { createSupervisor } from '@langchain/langgraph-supervisor';

import { PriceFinder } from './price-finder';

const add = tool(async (args) => args.a + args.b, {
  name: 'add',
  description: 'Add two numbers.',
  schema: z.object({
    a: z.number(),
    b: z.number(),
  }),
});

const multiply = tool(async (args) => args.a * args.b, {
  name: 'multiply',
  description: 'Multiply two numbers.',
  schema: z.object({
    a: z.number(),
    b: z.number(),
  }),
});

export class Supervisor {
  private async createMathAgent() {
    const model = await initChatModel('gpt-4o-mini', {
      temperature: 0,
    });

    return createReactAgent({
      llm: model,
      tools: [add, multiply],
      name: 'math_expert',
      prompt: 'You are a math expert. Always use one tool at a time.',
    });
  }

  private async createPriceFinderAgent() {
    const priceFinder = new PriceFinder();
    const workflow = priceFinder.getWorkflow();
    return workflow.compile({ name: 'price_finder' });
  }

  async getWorkflow() {
    const mathAgent = await this.createMathAgent();
    const priceFinderAgent = await this.createPriceFinderAgent();

    const model = await initChatModel('gpt-4o-mini', {
      temperature: 0,
    });

    return createSupervisor({
      agents: [mathAgent, priceFinderAgent],
      llm: model,
      prompt:
        'You are a team supervisor managing a research expert and a math expert. ' +
        'For current events, use research_agent. ' +
        'For math problems, use math_agent.',
    });
  }
}
