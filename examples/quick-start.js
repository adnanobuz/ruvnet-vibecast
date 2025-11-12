/**
 * Quick Start Example
 * A minimal example to get started with AgentDB
 */

import { AgentDB, simpleTextEmbedding } from '../src/index.js';

console.log('🚀 AgentDB Quick Start\n');

// 1. Create a database
const db = new AgentDB({ dimension: 384 });
console.log('✓ Database created\n');

// 2. Add some data
const texts = [
  'The quick brown fox jumps over the lazy dog',
  'Machine learning is fascinating',
  'I love programming in JavaScript',
  'The weather is nice today'
];

console.log('Adding data...');
texts.forEach(text => {
  const embedding = simpleTextEmbedding(text);
  db.addVector(embedding, { text });
  console.log(`  ✓ Added: "${text}"`);
});

// 3. Search for similar content
console.log('\n🔍 Searching...');
const query = 'Tell me about coding';
const queryEmbedding = simpleTextEmbedding(query);
const results = db.search(queryEmbedding, 2);

console.log(`Query: "${query}"\n`);
results.forEach((result, i) => {
  const similarity = ((1 - result.distance) * 100).toFixed(1);
  console.log(`${i + 1}. [${similarity}% match] ${result.metadata.text}`);
});

// 4. Get statistics
console.log('\n📊 Statistics:');
const stats = db.getStats();
console.log(`  Total vectors: ${stats.totalVectors}`);
console.log(`  Dimension: ${stats.dimension}`);

console.log('\n✨ Done! That was easy.\n');
