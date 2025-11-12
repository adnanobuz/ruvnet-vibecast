/**
 * AI Agent Memory Example
 * Demonstrates using AgentDB as persistent memory for an AI agent
 */

import { AgentDB, simpleTextEmbedding } from '../src/index.js';

console.log('🤖 AI Agent Memory System\n');
console.log('═'.repeat(60));

// Initialize agent memory
const memory = new AgentDB({ dimension: 384, maxElements: 10000 });

// Simulate agent interactions
class AIAgent {
  constructor(name, memoryDb) {
    this.name = name;
    this.memory = memoryDb;
    this.conversationCount = 0;
  }

  // Remember something
  remember(content, type = 'general') {
    this.conversationCount++;
    const embedding = simpleTextEmbedding(content);

    return this.memory.addVector(embedding, {
      content,
      type,
      agent: this.name,
      conversation: this.conversationCount,
      timestamp: new Date().toISOString()
    });
  }

  // Recall similar memories
  recall(query, limit = 3) {
    const embedding = simpleTextEmbedding(query);
    return this.memory.search(embedding, limit);
  }

  // Store reasoning about a decision
  recordReasoning(situation, thinking) {
    return this.memory.addReasoning(situation, thinking, {
      agent: this.name,
      timestamp: new Date().toISOString()
    });
  }

  // Get memory stats
  getMemoryStats() {
    return this.memory.getStats();
  }
}

// Create an AI agent
const agent = new AIAgent('Assistant-Alpha', memory);

console.log(`\n✨ Agent "${agent.name}" initialized\n`);

// Simulate a conversation
console.log('💬 Simulating conversation...\n');

// User interactions
const interactions = [
  { type: 'preference', content: 'User prefers TypeScript over JavaScript' },
  { type: 'task', content: 'User is building a chat application' },
  { type: 'skill', content: 'User is experienced with React and Node.js' },
  { type: 'goal', content: 'User wants to learn about vector databases' },
  { type: 'preference', content: 'User likes to work in VS Code' },
  { type: 'context', content: 'User is working on a startup project' },
  { type: 'task', content: 'User needs help with database optimization' }
];

interactions.forEach(({ type, content }) => {
  const id = agent.remember(content, type);
  console.log(`  💾 [${type}] ${content}`);
});

// Agent records its reasoning
console.log('\n🧠 Recording reasoning...\n');

agent.recordReasoning(
  'How should I help the user with their chat application?',
  `Given context:
- User prefers TypeScript
- Experienced with React/Node.js
- Building a chat app
- Interested in vector databases

Recommendation:
1. Suggest using TypeScript for type safety
2. Recommend React for the frontend with real-time updates
3. Use Node.js with Socket.io for the backend
4. Integrate AgentDB for semantic message search
5. Add context-aware suggestions based on conversation history`
);

console.log('  ✓ Reasoning pattern stored');

// Later in the conversation...
console.log('\n\n🔍 Agent recalling relevant context...\n');

const queries = [
  'What programming languages does the user know?',
  'What is the user working on?',
  'What does the user like?'
];

queries.forEach(query => {
  console.log(`❓ Query: "${query}"`);

  const memories = agent.recall(query, 2);

  memories.forEach((mem, i) => {
    const relevance = ((1 - mem.distance) * 100).toFixed(0);
    console.log(`  ${i + 1}. [${relevance}% relevant] ${mem.metadata.content}`);
    console.log(`     Type: ${mem.metadata.type} | Conv #${mem.metadata.conversation}`);
  });

  console.log('');
});

// Retrieve reasoning when needed
console.log('🧠 Retrieving past reasoning...\n');
const reasoningResults = agent.memory.searchReasoning('chat application');

if (reasoningResults.length > 0) {
  const reasoning = reasoningResults[0];
  console.log(`Context: ${reasoning.context}\n`);
  console.log(`Reasoning:\n${reasoning.reasoning}\n`);
}

// Memory statistics
console.log('\n📊 Memory Statistics:');
const stats = agent.getMemoryStats();
console.log(`  Memories stored: ${stats.totalVectors}`);
console.log(`  Reasoning patterns: ${stats.totalReasoning}`);
console.log(`  Conversations: ${agent.conversationCount}`);
console.log(`  Memory usage: ${(stats.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);

// Save memory for persistence
console.log('\n💾 Saving memory to disk...');
import { writeFileSync } from 'fs';

const memoryExport = agent.memory.export();
writeFileSync('agent-memory-backup.json', JSON.stringify(memoryExport, null, 2));
console.log('  ✓ Memory saved to agent-memory-backup.json');

console.log('\n═'.repeat(60));
console.log('✨ Agent memory system demo complete!\n');

// Use case summary
console.log('💡 Key Benefits:');
console.log('  • Agent remembers past interactions');
console.log('  • Context-aware responses based on history');
console.log('  • Reasoning patterns improve over time');
console.log('  • Persistent memory across sessions');
console.log('  • Fast semantic search through memories\n');
