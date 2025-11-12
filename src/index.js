/**
 * AgentDB - Main entry point
 * Export all public APIs
 */

export { AgentDB } from './agentdb.js';
export {
  simpleTextEmbedding,
  randomEmbedding,
  cosineSimilarity,
  printResults,
  printStats,
  benchmark
} from './utils.js';

// Re-export for convenience
import { AgentDB } from './agentdb.js';
export default AgentDB;
