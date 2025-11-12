/**
 * Advanced AgentDB Demo
 * Demonstrates advanced features: batch operations, performance testing, and analytics
 */

import { AgentDB } from '../src/agentdb.js';
import { simpleTextEmbedding, randomEmbedding, printStats, benchmark } from '../src/utils.js';

console.log('\n🚀 AgentDB Advanced Demo');
console.log('═'.repeat(80));

// Initialize with optimized settings
console.log('\n1️⃣  Initializing AgentDB with performance settings...');
const db = new AgentDB({
  dimension: 384,
  maxElements: 10000,
  m: 32,              // Higher M for better accuracy
  efConstruction: 400, // Higher for better quality
  efSearch: 100        // Higher for better recall
});

console.log('   ✅ Database initialized');

// Batch insert performance test
console.log('\n2️⃣  Performance Test: Batch Insert...');
const batchSizes = [100, 500, 1000];

for (const size of batchSizes) {
  const vectors = Array(size).fill(0).map(() => ({
    vector: randomEmbedding(384),
    metadata: {
      type: 'random',
      timestamp: Date.now(),
      batch: size
    }
  }));

  await benchmark(async () => {
    for (const { vector, metadata } of vectors) {
      db.addVector(vector, metadata);
    }
  }, `Insert ${size} vectors`);
}

console.log('\n   📊 Stats after batch insert:');
const stats = db.getStats();
console.log(`   Total vectors: ${stats.totalVectors}`);
console.log(`   Memory used: ${(stats.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);

// Search performance test
console.log('\n3️⃣  Performance Test: Search Speed...');
const searchTests = [
  { k: 5, name: 'Top 5' },
  { k: 10, name: 'Top 10' },
  { k: 50, name: 'Top 50' },
  { k: 100, name: 'Top 100' }
];

const queryVector = randomEmbedding(384);

for (const { k, name } of searchTests) {
  await benchmark(async () => {
    return db.search(queryVector, k);
  }, `Search ${name} results from ${stats.totalVectors} vectors`);
}

// Semantic clustering demo
console.log('\n4️⃣  Semantic Clustering: Code Snippets...');

const codeSnippets = [
  { code: 'function add(a, b) { return a + b; }', lang: 'javascript', type: 'function' },
  { code: 'const sum = (a, b) => a + b;', lang: 'javascript', type: 'arrow-function' },
  { code: 'def add(a, b): return a + b', lang: 'python', type: 'function' },
  { code: 'class Calculator { add(a, b) { return a + b; } }', lang: 'javascript', type: 'class' },
  { code: 'async function fetchData() { return await fetch(url); }', lang: 'javascript', type: 'async' },
  { code: 'const data = await fetch(url).then(r => r.json());', lang: 'javascript', type: 'async' },
  { code: 'for (let i = 0; i < 10; i++) { console.log(i); }', lang: 'javascript', type: 'loop' },
  { code: 'Array.from({length: 10}, (_, i) => i);', lang: 'javascript', type: 'functional' }
];

console.log('   Adding code snippets...');
for (const snippet of codeSnippets) {
  const embedding = simpleTextEmbedding(snippet.code);
  db.addVector(embedding, snippet);
}

// Find similar code
console.log('\n   🔍 Finding similar code patterns...');
const searchCode = 'sum two numbers';
const searchEmbedding = simpleTextEmbedding(searchCode);
const codeResults = db.search(searchEmbedding, 4);

console.log(`\n   Query: "${searchCode}"`);
console.log('   Similar code snippets:');
codeResults.forEach((result, idx) => {
  const similarity = (1 - result.distance) * 100;
  console.log(`\n   ${idx + 1}. [${similarity.toFixed(1)}%] ${result.metadata.lang}`);
  console.log(`      ${result.metadata.code}`);
  console.log(`      Type: ${result.metadata.type}`);
});

// Multi-query search (find items similar to multiple queries)
console.log('\n5️⃣  Multi-Query Search...');
const queries = [
  'async operations',
  'iteration patterns',
  'function definitions'
];

const multiResults = new Map();

for (const query of queries) {
  console.log(`\n   Processing: "${query}"`);
  const qEmbedding = simpleTextEmbedding(query);
  const results = db.search(qEmbedding, 2);

  results.forEach(result => {
    const id = result.id;
    if (!multiResults.has(id)) {
      multiResults.set(id, {
        ...result,
        queries: [query],
        totalScore: 1 - result.distance
      });
    } else {
      const existing = multiResults.get(id);
      existing.queries.push(query);
      existing.totalScore += (1 - result.distance);
      multiResults.set(id, existing);
    }
  });
}

// Rank by combined score
const rankedResults = Array.from(multiResults.values())
  .sort((a, b) => b.totalScore - a.totalScore)
  .slice(0, 5);

console.log('\n   📊 Top results across all queries:');
rankedResults.forEach((result, idx) => {
  console.log(`\n   ${idx + 1}. Combined Score: ${result.totalScore.toFixed(3)}`);
  console.log(`      ${result.metadata.code}`);
  console.log(`      Matched queries: ${result.queries.join(', ')}`);
});

// Memory management demo
console.log('\n6️⃣  Memory Management...');

const beforeStats = db.getStats();
console.log(`   Before cleanup: ${beforeStats.totalVectors} vectors`);

// Delete vectors with specific criteria (batch 100)
let deleted = 0;
for (const [id, entry] of db.memoryStore.entries()) {
  if (entry.metadata.batch === 100) {
    db.deleteVector(id);
    deleted++;
  }
}

const afterStats = db.getStats();
console.log(`   Deleted: ${deleted} vectors`);
console.log(`   After cleanup: ${afterStats.totalVectors} vectors`);

// Event tracking demo
console.log('\n7️⃣  Event Tracking...');

const events = [];
db.on('vectorAdded', (data) => events.push({ type: 'add', ...data }));
db.on('metadataUpdated', (data) => events.push({ type: 'update', ...data }));

// Perform some operations
const testVector = randomEmbedding(384);
const testId = db.addVector(testVector, { test: true });
db.updateMetadata(testId, { test: true, updated: true });

console.log(`   Tracked events: ${events.length}`);
events.forEach((event, idx) => {
  console.log(`   ${idx + 1}. ${event.type.toUpperCase()} - ID: ${event.id}`);
});

// Final statistics
console.log('\n8️⃣  Final Statistics:');
printStats(db.getStats());

console.log('✨ Advanced demo completed!');
console.log('═'.repeat(80) + '\n');
