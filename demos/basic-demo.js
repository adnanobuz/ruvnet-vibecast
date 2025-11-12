/**
 * Basic AgentDB Demo
 * Demonstrates core functionality: vector storage, search, and metadata
 */

import { AgentDB } from '../src/agentdb.js';
import { simpleTextEmbedding, printResults, printStats, benchmark } from '../src/utils.js';

console.log('\n🎯 AgentDB Basic Demo');
console.log('═'.repeat(80));

// Initialize database
console.log('\n1️⃣  Initializing AgentDB...');
const db = new AgentDB({
  dimension: 384,
  maxElements: 1000,
  efSearch: 50
});

// Set up event listeners
db.on('initialized', (config) => {
  console.log('✅ Database initialized with config:', config);
});

db.on('vectorAdded', ({ id, metadata }) => {
  console.log(`   ✓ Vector ${id} added: "${metadata.text?.substring(0, 50)}..."`);
});

// Sample data - AI agent memories
console.log('\n2️⃣  Adding sample memories...');
const memories = [
  { text: 'User prefers dark mode in applications', category: 'preference', importance: 'high' },
  { text: 'Project deadline is next Friday', category: 'task', importance: 'urgent' },
  { text: 'User is learning JavaScript and Python', category: 'skill', importance: 'medium' },
  { text: 'Meeting scheduled at 3 PM tomorrow', category: 'calendar', importance: 'high' },
  { text: 'User likes coffee in the morning', category: 'preference', importance: 'low' },
  { text: 'Code review needed for pull request #42', category: 'task', importance: 'high' },
  { text: 'User working on AgentDB integration', category: 'project', importance: 'urgent' },
  { text: 'Favorite programming language is TypeScript', category: 'preference', importance: 'medium' },
  { text: 'Team standup every morning at 9 AM', category: 'routine', importance: 'medium' },
  { text: 'Bug reported in authentication module', category: 'bug', importance: 'urgent' }
];

await benchmark(async () => {
  for (const memory of memories) {
    const embedding = simpleTextEmbedding(memory.text);
    db.addVector(embedding, memory);
  }
}, 'Adding 10 memories');

// Search for similar memories
console.log('\n3️⃣  Searching for similar memories...');

const queries = [
  'What are the urgent tasks?',
  'What does the user prefer?',
  'Tell me about the project'
];

for (const query of queries) {
  console.log(`\n🔍 Query: "${query}"`);

  const results = await benchmark(async () => {
    const embedding = simpleTextEmbedding(query);
    return db.search(embedding, 3);
  }, `Search for: "${query}"`);

  console.log('\n   Top 3 Results:');
  results.forEach((result, idx) => {
    const similarity = (1 - result.distance) * 100;
    console.log(`   ${idx + 1}. [${similarity.toFixed(1)}%] ${result.metadata.text}`);
    console.log(`      Category: ${result.metadata.category} | Importance: ${result.metadata.importance}`);
  });
}

// Filter by category
console.log('\n4️⃣  Filtering by category...');
const urgentTasks = Array.from(db.memoryStore.values())
  .filter(m => m.metadata.importance === 'urgent')
  .map(m => m.metadata.text);

console.log('\n   Urgent items:');
urgentTasks.forEach((task, idx) => {
  console.log(`   ${idx + 1}. ${task}`);
});

// Update metadata
console.log('\n5️⃣  Updating metadata...');
const firstId = 0;
db.updateMetadata(firstId, {
  importance: 'medium',
  lastAccessed: new Date().toISOString()
});
console.log(`   ✓ Updated metadata for vector ${firstId}`);

// Statistics
console.log('\n6️⃣  Database Statistics:');
printStats(db.getStats());

// Export/Import demo
console.log('\n7️⃣  Testing export/import...');
console.log('   Exporting database...');
const exportData = db.export();
console.log(`   ✓ Exported ${exportData.memoryStore.length} vectors`);

console.log('   Clearing database...');
db.clear();
console.log(`   ✓ Cleared. Current vectors: ${db.getStats().totalVectors}`);

console.log('   Importing data...');
db.import(exportData);
console.log(`   ✓ Imported. Current vectors: ${db.getStats().totalVectors}`);

// Final search to verify import
console.log('\n8️⃣  Verifying import with a search...');
const verifyQuery = simpleTextEmbedding('What tasks need attention?');
const verifyResults = db.search(verifyQuery, 3);

console.log('\n   Results after import:');
verifyResults.forEach((result, idx) => {
  console.log(`   ${idx + 1}. ${result.metadata.text}`);
});

console.log('\n✨ Demo completed successfully!');
console.log('═'.repeat(80) + '\n');
