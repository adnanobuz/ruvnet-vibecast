/**
 * Utility functions for AgentDB
 */

/**
 * Generate a simple hash-based embedding (for demo purposes)
 * In production, you would use a proper embedding model like sentence-transformers
 * @param {string} text - Text to embed
 * @param {number} dimension - Embedding dimension
 * @returns {Float32Array} The embedding vector
 */
export function simpleTextEmbedding(text, dimension = 384) {
  const vector = new Float32Array(dimension);

  // Simple hash-based embedding for demo
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const idx = (charCode * (i + 1)) % dimension;
    vector[idx] += charCode / 255.0;
  }

  // Normalize the vector
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < dimension; i++) {
      vector[i] /= magnitude;
    }
  }

  return vector;
}

/**
 * Generate random embedding (for testing)
 * @param {number} dimension - Embedding dimension
 * @returns {Float32Array} Random normalized vector
 */
export function randomEmbedding(dimension = 384) {
  const vector = new Float32Array(dimension);

  for (let i = 0; i < dimension; i++) {
    vector[i] = Math.random() * 2 - 1;
  }

  // Normalize
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  for (let i = 0; i < dimension; i++) {
    vector[i] /= magnitude;
  }

  return vector;
}

/**
 * Calculate cosine similarity between two vectors
 * @param {Float32Array|Array} a - First vector
 * @param {Float32Array|Array} b - Second vector
 * @returns {number} Cosine similarity [-1, 1]
 */
export function cosineSimilarity(a, b) {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same dimension');
  }

  let dotProduct = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(magA) * Math.sqrt(magB));
}

/**
 * Pretty print search results
 * @param {Array} results - Search results from AgentDB
 */
export function printResults(results) {
  console.log('\n🔍 Search Results:');
  console.log('═'.repeat(80));

  results.forEach((result, idx) => {
    console.log(`\n📍 Result #${idx + 1}`);
    console.log(`   ID: ${result.id}`);
    console.log(`   Distance: ${result.distance.toFixed(4)}`);
    console.log(`   Similarity: ${(1 - result.distance).toFixed(4)}`);
    if (result.metadata) {
      console.log(`   Metadata:`, JSON.stringify(result.metadata, null, 2).split('\n').join('\n   '));
    }
  });

  console.log('\n' + '═'.repeat(80));
}

/**
 * Format statistics
 * @param {Object} stats - Statistics from AgentDB
 */
export function printStats(stats) {
  console.log('\n📊 Database Statistics:');
  console.log('═'.repeat(80));
  console.log(`   Total Vectors: ${stats.totalVectors}`);
  console.log(`   Total Reasoning Entries: ${stats.totalReasoning}`);
  console.log(`   Dimension: ${stats.dimension}`);
  console.log(`   Max Elements: ${stats.maxElements}`);
  console.log(`   Memory Usage:`);
  console.log(`     RSS: ${(stats.memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`);
  console.log(`     Heap Used: ${(stats.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log('═'.repeat(80) + '\n');
}

/**
 * Benchmark function
 * @param {Function} fn - Function to benchmark
 * @param {string} name - Name of the operation
 * @returns {*} Result of the function
 */
export async function benchmark(fn, name = 'Operation') {
  const start = process.hrtime.bigint();
  const result = await fn();
  const end = process.hrtime.bigint();
  const duration = Number(end - start) / 1_000_000; // Convert to ms

  console.log(`⏱️  ${name}: ${duration.toFixed(2)}ms`);
  return result;
}

export default {
  simpleTextEmbedding,
  randomEmbedding,
  cosineSimilarity,
  printResults,
  printStats,
  benchmark
};
