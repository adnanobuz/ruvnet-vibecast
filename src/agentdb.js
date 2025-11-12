/**
 * AgentDB - Lightning-fast vector database and memory system for AI agents
 * Features HNSW indexing, ReasoningBank integration, and MCP support
 */

import hnswlib from 'hnswlib-node';
import { EventEmitter } from 'events';

const { HierarchicalNSW } = hnswlib;

export class AgentDB extends EventEmitter {
  constructor(options = {}) {
    super();

    this.dimension = options.dimension || 384; // Default embedding dimension
    this.maxElements = options.maxElements || 10000;
    this.m = options.m || 16; // HNSW M parameter
    this.efConstruction = options.efConstruction || 200;
    this.efSearch = options.efSearch || 50;

    // Initialize HNSW index
    this.index = new HierarchicalNSW('cosine', this.dimension);
    this.index.initIndex(this.maxElements, this.m, this.efConstruction);
    this.index.setEf(this.efSearch);

    // Memory store for metadata
    this.memoryStore = new Map();
    this.currentId = 0;

    // ReasoningBank integration
    this.reasoningBank = new Map();

    this.emit('initialized', { dimension: this.dimension, maxElements: this.maxElements });
  }

  /**
   * Add a vector with metadata to the database
   * @param {Float32Array|Array} vector - The embedding vector
   * @param {Object} metadata - Associated metadata
   * @returns {number} The ID of the added vector
   */
  addVector(vector, metadata = {}) {
    const id = this.currentId++;
    const vectorArray = vector instanceof Float32Array ? vector : new Float32Array(vector);

    if (vectorArray.length !== this.dimension) {
      throw new Error(`Vector dimension ${vectorArray.length} does not match index dimension ${this.dimension}`);
    }

    // Convert to regular array for hnswlib-node
    this.index.addPoint(Array.from(vectorArray), id);
    this.memoryStore.set(id, {
      vector: vectorArray,
      metadata,
      timestamp: Date.now(),
      id
    });

    this.emit('vectorAdded', { id, metadata });
    return id;
  }

  /**
   * Search for nearest neighbors
   * @param {Float32Array|Array} query - Query vector
   * @param {number} k - Number of results
   * @returns {Array} Array of results with id, distance, and metadata
   */
  search(query, k = 5) {
    const queryArray = query instanceof Float32Array ? query : new Float32Array(query);

    if (queryArray.length !== this.dimension) {
      throw new Error(`Query dimension ${queryArray.length} does not match index dimension ${this.dimension}`);
    }

    // Convert to regular array for hnswlib-node
    const result = this.index.searchKnn(Array.from(queryArray), k);

    return result.neighbors.map((id, idx) => ({
      id,
      distance: result.distances[idx],
      ...this.memoryStore.get(id)
    }));
  }

  /**
   * Add reasoning to the ReasoningBank
   * @param {string} context - The context or query
   * @param {string} reasoning - The reasoning process
   * @param {Object} metadata - Additional metadata
   */
  addReasoning(context, reasoning, metadata = {}) {
    const id = `reasoning_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.reasoningBank.set(id, {
      context,
      reasoning,
      metadata,
      timestamp: Date.now()
    });

    this.emit('reasoningAdded', { id, context });
    return id;
  }

  /**
   * Get reasoning from the bank
   * @param {string} id - Reasoning ID
   * @returns {Object} The reasoning entry
   */
  getReasoning(id) {
    return this.reasoningBank.get(id);
  }

  /**
   * Search reasoning bank by context
   * @param {string} searchTerm - Term to search for
   * @returns {Array} Matching reasoning entries
   */
  searchReasoning(searchTerm) {
    const results = [];
    for (const [id, entry] of this.reasoningBank.entries()) {
      if (entry.context.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.reasoning.toLowerCase().includes(searchTerm.toLowerCase())) {
        results.push({ id, ...entry });
      }
    }
    return results;
  }

  /**
   * Get database statistics
   * @returns {Object} Database statistics
   */
  getStats() {
    return {
      totalVectors: this.memoryStore.size,
      totalReasoning: this.reasoningBank.size,
      dimension: this.dimension,
      maxElements: this.maxElements,
      memoryUsage: process.memoryUsage()
    };
  }

  /**
   * Clear all data
   */
  clear() {
    this.index = new HierarchicalNSW('cosine', this.dimension);
    this.index.initIndex(this.maxElements, this.m, this.efConstruction);
    this.index.setEf(this.efSearch);
    this.memoryStore.clear();
    this.reasoningBank.clear();
    this.currentId = 0;
    this.emit('cleared');
  }

  /**
   * Delete a vector by ID
   * @param {number} id - Vector ID to delete
   */
  deleteVector(id) {
    if (this.memoryStore.has(id)) {
      this.memoryStore.delete(id);
      this.emit('vectorDeleted', { id });
      return true;
    }
    return false;
  }

  /**
   * Update metadata for a vector
   * @param {number} id - Vector ID
   * @param {Object} metadata - New metadata
   */
  updateMetadata(id, metadata) {
    const entry = this.memoryStore.get(id);
    if (entry) {
      entry.metadata = { ...entry.metadata, ...metadata };
      this.memoryStore.set(id, entry);
      this.emit('metadataUpdated', { id, metadata });
      return true;
    }
    return false;
  }

  /**
   * Export data for persistence
   * @returns {Object} Serializable data
   */
  export() {
    return {
      memoryStore: Array.from(this.memoryStore.entries()).map(([id, data]) => ({
        id,
        vector: Array.from(data.vector),
        metadata: data.metadata,
        timestamp: data.timestamp
      })),
      reasoningBank: Array.from(this.reasoningBank.entries()),
      currentId: this.currentId,
      config: {
        dimension: this.dimension,
        maxElements: this.maxElements,
        m: this.m,
        efConstruction: this.efConstruction,
        efSearch: this.efSearch
      }
    };
  }

  /**
   * Import data from export
   * @param {Object} data - Data to import
   */
  import(data) {
    this.clear();

    // Restore config
    if (data.config) {
      this.dimension = data.config.dimension;
      this.maxElements = data.config.maxElements;
    }

    // Restore memory store and rebuild index
    if (data.memoryStore) {
      for (const entry of data.memoryStore) {
        const vector = new Float32Array(entry.vector);
        this.addVector(vector, entry.metadata);
      }
    }

    // Restore reasoning bank
    if (data.reasoningBank) {
      this.reasoningBank = new Map(data.reasoningBank);
    }

    this.currentId = data.currentId || this.currentId;
    this.emit('imported', { vectors: this.memoryStore.size, reasoning: this.reasoningBank.size });
  }
}

export default AgentDB;
