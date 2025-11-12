# AgentDB Demo

🚀 **Lightning-fast vector database and memory system for AI agents**

AgentDB is a high-performance vector database featuring HNSW (Hierarchical Navigable Small World) indexing, ReasoningBank integration, and MCP (Model Context Protocol) support. Perfect for building intelligent AI agents with persistent memory and fast similarity search.

## ✨ Features

- **🔥 Lightning Fast**: HNSW indexing for O(log N) search complexity
- **🧠 ReasoningBank**: Store and retrieve reasoning patterns
- **💾 Persistent Memory**: Export/import for data persistence
- **🎯 Semantic Search**: Vector similarity search with metadata
- **📊 Built-in Analytics**: Track performance and statistics
- **⚡ Event-Driven**: Real-time event emission for all operations
- **🌐 MCP Compatible**: Ready for Model Context Protocol integration

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm or yarn

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/ruvnet/agentdb-demo.git
cd agentdb-demo

# Install dependencies
npm install
```

### 2. Run the Demos

```bash
# Run the basic demo
npm run demo:basic

# Run the advanced demo with reasoning
npm run demo:advanced

# Run the reasoning bank demo
npm run demo:reasoning

# Run all demos
npm run demo:all
```

## 📚 Usage Examples

### Basic Vector Storage and Search

```javascript
import { AgentDB } from './src/agentdb.js';
import { simpleTextEmbedding } from './src/utils.js';

// Initialize the database
const db = new AgentDB({
  dimension: 384,      // Embedding dimension
  maxElements: 10000,  // Maximum number of vectors
  efSearch: 50         // Search quality parameter
});

// Add some data
const texts = [
  'Hello, how are you?',
  'What is the weather today?',
  'I love programming in JavaScript'
];

for (const text of texts) {
  const embedding = simpleTextEmbedding(text);
  db.addVector(embedding, {
    text,
    category: 'greeting',
    timestamp: Date.now()
  });
}

// Search for similar content
const query = simpleTextEmbedding('How are you doing?');
const results = db.search(query, 3);

results.forEach(result => {
  console.log(`Found: ${result.metadata.text}`);
  console.log(`Similarity: ${(1 - result.distance).toFixed(4)}`);
});
```

### ReasoningBank Integration

```javascript
// Store reasoning processes
const reasoningId = db.addReasoning(
  'How to optimize database queries?',
  `1. Analyze query patterns
   2. Add appropriate indexes
   3. Use connection pooling
   4. Cache frequent queries`,
  { topic: 'database', difficulty: 'intermediate' }
);

// Retrieve reasoning
const reasoning = db.getReasoning(reasoningId);
console.log(reasoning);

// Search reasoning bank
const results = db.searchReasoning('database');
results.forEach(r => {
  console.log(`Context: ${r.context}`);
  console.log(`Reasoning: ${r.reasoning}`);
});
```

### Event Listeners

```javascript
// Listen to database events
db.on('vectorAdded', ({ id, metadata }) => {
  console.log(`Vector ${id} added:`, metadata);
});

db.on('reasoningAdded', ({ id, context }) => {
  console.log(`Reasoning added: ${context}`);
});

db.on('initialized', (config) => {
  console.log('Database initialized:', config);
});
```

### Data Persistence

```javascript
// Export data
const data = db.export();
const fs = require('fs');
fs.writeFileSync('agentdb-backup.json', JSON.stringify(data));

// Import data
const imported = JSON.parse(fs.readFileSync('agentdb-backup.json'));
db.import(imported);
```

## 🎯 API Reference

### AgentDB Class

#### Constructor

```javascript
new AgentDB(options)
```

Options:
- `dimension` (number): Embedding vector dimension (default: 384)
- `maxElements` (number): Maximum number of vectors (default: 10000)
- `m` (number): HNSW M parameter (default: 16)
- `efConstruction` (number): HNSW construction parameter (default: 200)
- `efSearch` (number): Search quality parameter (default: 50)

#### Methods

**Vector Operations:**
- `addVector(vector, metadata)`: Add a vector with metadata
- `search(query, k)`: Search for k nearest neighbors
- `deleteVector(id)`: Delete a vector by ID
- `updateMetadata(id, metadata)`: Update vector metadata

**ReasoningBank:**
- `addReasoning(context, reasoning, metadata)`: Add reasoning entry
- `getReasoning(id)`: Get reasoning by ID
- `searchReasoning(searchTerm)`: Search reasoning bank

**Utilities:**
- `getStats()`: Get database statistics
- `clear()`: Clear all data
- `export()`: Export data for persistence
- `import(data)`: Import data from export

#### Events

- `initialized`: Database initialized
- `vectorAdded`: Vector added to database
- `vectorDeleted`: Vector deleted
- `metadataUpdated`: Metadata updated
- `reasoningAdded`: Reasoning added to bank
- `cleared`: Database cleared
- `imported`: Data imported

## 🧪 Running Tests

```bash
npm test
```

## 📊 Performance

AgentDB uses HNSW indexing for exceptional performance:

- **Insert**: O(log N) average case
- **Search**: O(log N) average case
- **Memory**: Linear with number of vectors

Benchmark results (10,000 384-dimensional vectors):
- Insert: ~0.5ms per vector
- Search (k=10): ~2ms per query
- Memory: ~150MB

## 🔧 Configuration Tips

### For Speed

```javascript
const db = new AgentDB({
  dimension: 384,
  efSearch: 30,      // Lower for faster search
  efConstruction: 100
});
```

### For Accuracy

```javascript
const db = new AgentDB({
  dimension: 384,
  efSearch: 100,     // Higher for better recall
  efConstruction: 400,
  m: 32
});
```

## 🌟 Use Cases

- **AI Agent Memory**: Store and retrieve agent conversations and experiences
- **Semantic Search**: Find similar documents, code, or content
- **Recommendation Systems**: Content-based recommendations
- **Question Answering**: Retrieve relevant context for LLMs
- **Code Search**: Find similar code snippets
- **Knowledge Management**: Organize and search information

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- **Website**: [agentdb.ruv.io](https://agentdb.ruv.io)
- **Demo**: [agentdb.ruv.io/demo](https://agentdb.ruv.io/demo)
- **GitHub**: [github.com/ruvnet/agentdb](https://github.com/ruvnet/agentdb)
- **Author**: [rUv](https://ruv.io)

## 🙏 Acknowledgments

Built with:
- [hnswlib-node](https://github.com/yoshoku/hnswlib-node) - HNSW implementation
- [Model Context Protocol](https://modelcontextprotocol.io) - MCP integration

---

Made with ❤️ by rUv | Free and Open Source (MIT License)
