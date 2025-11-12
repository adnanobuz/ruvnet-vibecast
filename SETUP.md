# AgentDB Setup Guide

This guide will walk you through setting up and running the AgentDB demo.

## Prerequisites

Before you begin, ensure you have:

- **Node.js** version 18.0.0 or higher
- **npm** (comes with Node.js) or **yarn**
- **Git** (for cloning the repository)

### Check your Node.js version

```bash
node --version
```

If you need to install or upgrade Node.js, visit [nodejs.org](https://nodejs.org/)

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/ruvnet/agentdb-demo.git
cd agentdb-demo
```

Or if you already have the code:

```bash
cd ruvnet-vibecast
```

### 2. Install Dependencies

```bash
npm install
```

This will install:
- `hnswlib-node` - High-performance HNSW vector search
- `@modelcontextprotocol/sdk` - MCP integration (optional)

Expected installation time: 1-2 minutes

### 3. Verify Installation

Check that everything is installed correctly:

```bash
npm list --depth=0
```

You should see the dependencies listed without errors.

## Running the Demos

### Basic Demo

The basic demo shows core AgentDB features:
- Vector storage and retrieval
- Semantic search
- Metadata filtering
- Export/import

```bash
npm run demo:basic
```

### Advanced Demo

The advanced demo includes:
- Performance benchmarking
- Batch operations
- Code similarity search
- Memory management

```bash
npm run demo:advanced
```

### Reasoning Demo

The reasoning demo demonstrates:
- ReasoningBank storage and retrieval
- Pattern matching
- Domain-specific reasoning
- Vector + reasoning integration

```bash
npm run demo:reasoning
```

### Run All Demos

```bash
npm run demo:all
```

## Project Structure

```
agentdb-demo/
├── src/
│   ├── agentdb.js       # Main AgentDB class
│   ├── utils.js         # Utility functions
│   └── index.js         # Entry point
├── demos/
│   ├── basic-demo.js    # Basic features demo
│   ├── advanced-demo.js # Advanced features demo
│   └── reasoning-demo.js # ReasoningBank demo
├── package.json         # Dependencies and scripts
├── README.md           # Main documentation
└── SETUP.md            # This file
```

## Troubleshooting

### Issue: `Cannot find module 'hnswlib-node'`

**Solution:** The native module failed to install. Try:

```bash
npm install hnswlib-node --build-from-source
```

Or install build tools:
- **macOS**: `xcode-select --install`
- **Ubuntu/Debian**: `sudo apt-get install build-essential`
- **Windows**: Install Visual Studio Build Tools

### Issue: `ERR_UNSUPPORTED_ESM_URL_SCHEME`

**Solution:** Make sure you're using Node.js 18+ and that `package.json` has `"type": "module"`

### Issue: Out of Memory

**Solution:** Increase Node.js memory limit:

```bash
node --max-old-space-size=4096 demos/basic-demo.js
```

## Next Steps

1. **Explore the Code**: Look at the source files in `src/` to understand the implementation
2. **Modify the Demos**: Try changing parameters in the demo files
3. **Build Your Own**: Use AgentDB in your own project:

```javascript
import { AgentDB } from './src/agentdb.js';

const db = new AgentDB({ dimension: 384 });
// Your code here
```

## Integration Examples

### Using in Your Project

Install as a dependency:

```bash
npm install agentdb
```

Or use the local version:

```javascript
import { AgentDB, simpleTextEmbedding } from './path/to/src/index.js';

const db = new AgentDB();
const embedding = simpleTextEmbedding('Hello world');
db.addVector(embedding, { text: 'Hello world' });
```

### With Real Embeddings

For production use, integrate with a proper embedding model:

```javascript
// Example with OpenAI embeddings
import OpenAI from 'openai';
import { AgentDB } from 'agentdb';

const openai = new OpenAI();
const db = new AgentDB({ dimension: 1536 }); // OpenAI ada-002 dimension

async function addText(text) {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });

  const embedding = response.data[0].embedding;
  return db.addVector(embedding, { text });
}
```

## Performance Tips

1. **Adjust HNSW Parameters**:
   - Lower `efSearch` for faster search (less accurate)
   - Higher `efSearch` for better recall (slower)
   - Higher `m` for better quality (more memory)

2. **Batch Operations**:
   - Add vectors in batches for better throughput
   - Use events to track progress

3. **Memory Management**:
   - Regularly export data for persistence
   - Delete old vectors to free memory
   - Monitor with `getStats()`

## Getting Help

- **Documentation**: See [README.md](README.md) for API reference
- **Issues**: Report bugs on GitHub
- **Community**: Join discussions on GitHub

## License

MIT License - see LICENSE file for details
