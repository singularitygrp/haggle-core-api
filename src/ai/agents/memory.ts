import { InMemoryStore } from '@langchain/langgraph';
import { MemorySaver } from '@langchain/langgraph-checkpoint';

export const memorySaver = new MemorySaver();
export const inMemoryStore = new InMemoryStore();
