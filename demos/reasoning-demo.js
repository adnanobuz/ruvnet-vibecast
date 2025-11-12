/**
 * ReasoningBank Demo
 * Demonstrates the ReasoningBank feature for storing and retrieving reasoning patterns
 */

import { AgentDB } from '../src/agentdb.js';
import { simpleTextEmbedding } from '../src/utils.js';

console.log('\n🧠 AgentDB ReasoningBank Demo');
console.log('═'.repeat(80));

// Initialize database
console.log('\n1️⃣  Initializing AgentDB with ReasoningBank...');
const db = new AgentDB({ dimension: 384 });

db.on('reasoningAdded', ({ id, context }) => {
  console.log(`   ✓ Reasoning added [${id.substring(0, 20)}...]: "${context.substring(0, 50)}..."`);
});

// Add reasoning patterns for different scenarios
console.log('\n2️⃣  Building ReasoningBank with AI reasoning patterns...');

const reasoningPatterns = [
  {
    context: 'How to debug a performance issue in a web application?',
    reasoning: `
Step 1: Identify the symptoms
  - Slow page loads, high memory usage, or unresponsive UI?

Step 2: Use profiling tools
  - Chrome DevTools Performance tab
  - Lighthouse for overall metrics
  - Network tab for API calls

Step 3: Analyze results
  - Look for long tasks (>50ms)
  - Check for memory leaks
  - Identify unnecessary re-renders

Step 4: Implement fixes
  - Optimize expensive operations
  - Implement code splitting
  - Add memoization where needed
  - Use virtual scrolling for long lists`,
    metadata: { domain: 'web-development', difficulty: 'intermediate', tags: ['performance', 'debugging'] }
  },
  {
    context: 'How to design a scalable API architecture?',
    reasoning: `
Step 1: Define requirements
  - Expected traffic volume
  - Data consistency needs
  - Latency requirements

Step 2: Choose architecture pattern
  - RESTful for simplicity
  - GraphQL for flexible queries
  - gRPC for high performance

Step 3: Design for scalability
  - Use load balancers
  - Implement caching (Redis, CDN)
  - Database read replicas
  - Horizontal scaling capability

Step 4: Add observability
  - Logging (structured logs)
  - Metrics (Prometheus, Grafana)
  - Tracing (OpenTelemetry)
  - Health checks and alerting`,
    metadata: { domain: 'backend', difficulty: 'advanced', tags: ['architecture', 'scalability', 'api'] }
  },
  {
    context: 'How to choose the right database for a project?',
    reasoning: `
Step 1: Analyze data structure
  - Structured/relational → SQL (PostgreSQL, MySQL)
  - Semi-structured → Document DB (MongoDB)
  - Graph relationships → Graph DB (Neo4j)
  - Time-series → Time-series DB (InfluxDB)

Step 2: Consider query patterns
  - Complex joins → SQL
  - Key-value lookups → Redis, DynamoDB
  - Full-text search → Elasticsearch

Step 3: Evaluate scale requirements
  - Small scale → SQLite, PostgreSQL
  - Large scale → Distributed systems (Cassandra, CockroachDB)

Step 4: Consider operational factors
  - Team expertise
  - Hosting/managed services available
  - Cost at scale
  - Backup and disaster recovery`,
    metadata: { domain: 'database', difficulty: 'intermediate', tags: ['database', 'architecture'] }
  },
  {
    context: 'How to implement effective error handling in production?',
    reasoning: `
Step 1: Categorize errors
  - Expected errors (validation, not found)
  - Unexpected errors (bugs, infrastructure)
  - Critical errors (data corruption, security)

Step 2: Implement error boundaries
  - Try-catch blocks for known failure points
  - Global error handlers for uncaught exceptions
  - Async error handling (promises, async/await)

Step 3: Add context and logging
  - Include request ID, user ID, timestamp
  - Log stack traces for debugging
  - Use structured logging (JSON format)

Step 4: User experience
  - Friendly error messages for users
  - Graceful degradation when possible
  - Retry mechanisms for transient failures
  - Circuit breakers for failing services`,
    metadata: { domain: 'engineering', difficulty: 'intermediate', tags: ['error-handling', 'production', 'reliability'] }
  },
  {
    context: 'How to secure a web application?',
    reasoning: `
Step 1: Authentication & Authorization
  - Use proven auth systems (OAuth, JWT)
  - Implement MFA for sensitive operations
  - Role-based access control (RBAC)

Step 2: Data protection
  - HTTPS everywhere (TLS 1.3+)
  - Encrypt sensitive data at rest
  - Secure password storage (bcrypt, Argon2)

Step 3: Prevent common attacks
  - SQL injection → Parameterized queries
  - XSS → Content Security Policy, sanitize input
  - CSRF → CSRF tokens
  - Rate limiting to prevent abuse

Step 4: Security monitoring
  - Log authentication attempts
  - Monitor for suspicious patterns
  - Regular security audits
  - Keep dependencies updated`,
    metadata: { domain: 'security', difficulty: 'advanced', tags: ['security', 'web', 'authentication'] }
  }
];

// Add all reasoning patterns
for (const pattern of reasoningPatterns) {
  db.addReasoning(pattern.context, pattern.reasoning, pattern.metadata);
}

console.log(`\n   ✅ Added ${reasoningPatterns.length} reasoning patterns to the bank`);

// Search for reasoning by topic
console.log('\n3️⃣  Searching ReasoningBank...');

const searches = [
  'performance',
  'database',
  'security',
  'scalability'
];

for (const searchTerm of searches) {
  console.log(`\n   🔍 Search: "${searchTerm}"`);
  const results = db.searchReasoning(searchTerm);

  if (results.length > 0) {
    console.log(`   Found ${results.length} matching reasoning pattern(s):`);
    results.forEach((result, idx) => {
      console.log(`\n   ${idx + 1}. ${result.context}`);
      console.log(`      Domain: ${result.metadata.domain}`);
      console.log(`      Tags: ${result.metadata.tags.join(', ')}`);
      console.log(`      Reasoning preview:`);
      const preview = result.reasoning.split('\n').slice(0, 5).join('\n');
      console.log(`      ${preview}...`);
    });
  } else {
    console.log('   No matching patterns found');
  }
}

// Retrieve specific reasoning by ID
console.log('\n4️⃣  Retrieving specific reasoning by ID...');
const allIds = Array.from(db.reasoningBank.keys());
if (allIds.length > 0) {
  const firstId = allIds[0];
  const reasoning = db.getReasoning(firstId);

  console.log(`\n   Retrieved reasoning:`);
  console.log(`   ID: ${firstId}`);
  console.log(`   Context: ${reasoning.context}`);
  console.log(`   Domain: ${reasoning.metadata.domain}`);
  console.log(`   \n   Full reasoning:\n${reasoning.reasoning}`);
}

// Combine vector search with reasoning
console.log('\n5️⃣  Combining Vector Search + ReasoningBank...');

// Add vectors for quick semantic search
console.log('\n   Adding vector embeddings for reasoning contexts...');
const reasoningVectors = [];

for (const [id, reasoning] of db.reasoningBank.entries()) {
  const embedding = simpleTextEmbedding(reasoning.context);
  const vectorId = db.addVector(embedding, {
    reasoningId: id,
    context: reasoning.context,
    domain: reasoning.metadata.domain,
    tags: reasoning.metadata.tags
  });
  reasoningVectors.push({ vectorId, reasoningId: id });
}

console.log(`   ✓ Added ${reasoningVectors.length} vector embeddings`);

// Now perform semantic search
console.log('\n   🔍 Semantic search: "How do I make my app faster?"');
const query = simpleTextEmbedding('How do I make my app faster?');
const searchResults = db.search(query, 3);

console.log('\n   Most relevant reasoning patterns:');
searchResults.forEach((result, idx) => {
  const similarity = (1 - result.distance) * 100;
  const reasoning = db.getReasoning(result.metadata.reasoningId);

  console.log(`\n   ${idx + 1}. [${similarity.toFixed(1)}% relevant] ${result.metadata.context}`);
  console.log(`      Domain: ${result.metadata.domain}`);
  console.log(`      Tags: ${result.metadata.tags.join(', ')}`);

  if (reasoning) {
    const steps = reasoning.reasoning.split('\n').filter(line => line.includes('Step')).slice(0, 2);
    console.log(`      First steps:\n      ${steps.join('\n      ')}`);
  }
});

// Filter by domain
console.log('\n6️⃣  Filtering reasoning by domain...');
const domains = new Map();

for (const [id, reasoning] of db.reasoningBank.entries()) {
  const domain = reasoning.metadata.domain;
  if (!domains.has(domain)) {
    domains.set(domain, []);
  }
  domains.get(domain).push(reasoning);
}

console.log('\n   Reasoning patterns by domain:');
for (const [domain, patterns] of domains.entries()) {
  console.log(`   ${domain}: ${patterns.length} pattern(s)`);
  patterns.forEach(p => {
    console.log(`     - ${p.context}`);
  });
}

// Statistics
console.log('\n7️⃣  ReasoningBank Statistics:');
const stats = db.getStats();
console.log(`   Total reasoning patterns: ${stats.totalReasoning}`);
console.log(`   Total vectors (for search): ${stats.totalVectors}`);
console.log(`   Domains covered: ${domains.size}`);
console.log(`   Memory usage: ${(stats.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);

// Export reasoning bank
console.log('\n8️⃣  Exporting ReasoningBank...');
const exportData = db.export();
console.log(`   ✓ Exported ${exportData.reasoningBank.length} reasoning entries`);
console.log(`   ✓ Exported ${exportData.memoryStore.length} vector embeddings`);

console.log('\n✨ ReasoningBank demo completed!');
console.log('═'.repeat(80) + '\n');

// Example use case
console.log('\n💡 Use Case Example:');
console.log('   An AI agent can now:');
console.log('   1. Store reasoning patterns from past problem-solving');
console.log('   2. Quickly retrieve relevant patterns using semantic search');
console.log('   3. Apply proven reasoning to new, similar problems');
console.log('   4. Build a growing knowledge base over time');
console.log('   5. Share reasoning patterns across agent instances\n');
