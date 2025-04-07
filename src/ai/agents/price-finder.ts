/**
 * Price Finder: A LangGraph workflow that routes user requests to either a general response
 * or a Computer Use Agent (CUA) for web-based price lookups.
 */

import { z } from 'zod';
import { BaseMessage } from '@langchain/core/messages';
import { initChatModel } from 'langchain/chat_models/universal';
import { createCua, CUAAnnotation } from '@langchain/langgraph-cua';
import { Annotation, END, START, StateGraph } from '@langchain/langgraph';

const configuredCuaGraph = createCua();

const PriceFinderAnnotation = Annotation.Root({
  ...CUAAnnotation.spec,
  route: Annotation<'respond' | 'computer_use_agent'>(),
});

type PriceFinderState = typeof PriceFinderAnnotation.State;
type PriceFinderUpdate = typeof PriceFinderAnnotation.Update;

export class PriceFinder {
  /**
   * Analyzes the user's latest message and determines whether to route to the
   * computer use agent or to generate a direct response.
   *
   * @param state Current workflow state containing message history
   * @returns Updated state with routing decision
   */
  private async processInput(
    state: PriceFinderState,
  ): Promise<PriceFinderUpdate> {
    const systemMessage = {
      role: 'system',
      content:
        "You're an advanced AI assistant tasked with routing the user's query to the appropriate node. " +
        "Your options are: computer use or respond. You should pick computer use if the user's request requires " +
        'using a computer (e.g. looking up a price on a website), and pick respond for ANY other inputs.',
    };

    const routingSchema = z.object({
      route: z
        .enum(['respond', 'computer_use_agent'])
        .describe(
          "The node to route to, either 'computer_use_agent' for any input which might require using a computer to assist the user, or 'respond' for any other input",
        ),
    });

    const model = await initChatModel('gpt-4o-mini', {
      temperature: 0,
    });

    const modelWithTools = model.withStructuredOutput(routingSchema);

    const messages = [
      systemMessage,
      {
        role: 'user',
        content: state.messages[state.messages.length - 1].content,
      },
    ];

    const response = await modelWithTools.invoke(messages);
    return { route: response.route };
  }

  /**
   * Formats a list of messages into a single string with type and content.
   *
   * @param messages List of messages to format
   * @returns Formatted string of messages
   */
  private formatMessages(messages: BaseMessage[]): string {
    return messages
      .map((message) => `${message._getType()}: ${message.content}`)
      .join('\n');
  }

  /**
   * Generates a general response to the user based on the entire conversation history.
   *
   * @param state Current workflow state containing full message history
   * @returns Updated state with the generated response
   */
  private async respond(state: PriceFinderState): Promise<PriceFinderUpdate> {
    const systemMessage = {
      role: 'system',
      content:
        "You're an advanced AI assistant tasked with responding to the user's input. " +
        "You're provided with the full conversation between the user, and the AI assistant. " +
        'This conversation may include messages from a computer use agent, along with ' +
        'general user inputs and AI responses. \n\n' +
        "Given all of this, please RESPOND to the user. If there is nothing to respond to, you may return something like 'Let me know if you have any other questions.'",
    };

    const humanMessage = {
      role: 'user',
      content:
        'Here are all of the messages in the conversation:\n\n' +
        this.formatMessages(state.messages),
    };

    const model = await initChatModel('gpt-4o-mini', {
      temperature: 0,
    });

    const response = await model.invoke([systemMessage, humanMessage]);

    return { messages: [response] };
  }

  /**
   * Conditional router that returns the route determined by processInput.
   *
   * @param state Current workflow state with route decision
   * @returns String route name for the next node
   */
  private routeAfterProcessingInput(state: PriceFinderState): string {
    return state.route || 'respond';
  }

  /**
   * Creates the workflow graph using LangGraph's StateGraph.
   *
   * @returns Configured workflow graph
   */
  getWorkflow() {
    return new StateGraph(PriceFinderAnnotation)
      .addNode('process_input', this.processInput)
      .addNode('respond', this.respond)
      .addNode('computer_use_agent', configuredCuaGraph)
      .addEdge(START, 'process_input')
      .addConditionalEdges('process_input', this.routeAfterProcessingInput, [
        'respond',
        'computer_use_agent',
      ])
      .addEdge('respond', END)
      .addEdge('computer_use_agent', END);
  }
}
