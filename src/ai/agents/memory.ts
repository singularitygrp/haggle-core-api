import { InMemoryStore } from '@langchain/langgraph';
import { MemorySaver } from '@langchain/langgraph-checkpoint';

export const store = new InMemoryStore();
export const checkpointer = new MemorySaver();
