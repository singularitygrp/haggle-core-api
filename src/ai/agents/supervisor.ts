import { z } from 'zod';
import { tool } from '@langchain/core/tools';
import { initChatModel } from 'langchain/chat_models/universal';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { createSupervisor } from '@langchain/langgraph-supervisor';

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

const webSearch = tool(
  async (args) => {
    return (
      'Here are the headcounts for each of the FAANG companies in 2024:\n' +
      '1. **Facebook (Meta)**: 67,317 employees.\n' +
      '2. **Apple**: 164,000 employees.\n' +
      '3. **Amazon**: 1,551,000 employees.\n' +
      '4. **Netflix**: 14,000 employees.\n' +
      '5. **Google (Alphabet)**: 181,269 employees.'
    );
  },
  {
    name: 'web_search',
    description: 'Search the web for information.',
    schema: z.object({
      query: z.string(),
    }),
  },
);

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

  private async createResearchAgent() {
    const model = await initChatModel('gpt-4o-mini', {
      temperature: 0,
    });

    return createReactAgent({
      llm: model,
      tools: [webSearch],
      name: 'research_expert',
      prompt:
        'You are a world class researcher with access to web search. Do not do any math.',
    });
  }

  async getWorkflow() {
    const mathAgent = await this.createMathAgent();
    const researchAgent = await this.createResearchAgent();

    const model = await initChatModel('gpt-4o-mini', {
      temperature: 0,
    });

    return createSupervisor({
      agents: [researchAgent, mathAgent],
      llm: model,
      prompt:
        'You are a team supervisor managing a research expert and a math expert. ' +
        'For current events, use research_agent. ' +
        'For math problems, use math_agent.',
    });
  }
}
