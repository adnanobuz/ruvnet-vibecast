const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Demo Markets with initial prices
const markets = {
    'BTC/USD': { price: 45000, change: 0, volatility: 50 },
    'ETH/USD': { price: 2800, change: 0, volatility: 30 },
    'SOL/USD': { price: 105, change: 0, volatility: 15 },
    'ADA/USD': { price: 0.65, change: 0.01, volatility: 0.02 },
    'DOGE/USD': { price: 0.15, change: 0.001, volatility: 0.005 },
    'XRP/USD': { price: 0.55, change: 0.01, volatility: 0.015 }
};

// Store price history for each market
const priceHistory = {};
Object.keys(markets).forEach(pair => {
    priceHistory[pair] = [markets[pair].price];
});

// User accounts (in-memory for demo)
const users = new Map();

class UserAccount {
    constructor(id) {
        this.id = id;
        this.balance = 10000; // Starting balance in USD
        this.portfolio = {}; // { asset: { amount, avgPrice } }
    }

    buyAsset(pair, amount, price) {
        const [asset, currency] = pair.split('/');
        const total = amount * price;

        if (this.balance < total) {
            throw new Error('Insufficient balance');
        }

        this.balance -= total;

        if (!this.portfolio[asset]) {
            this.portfolio[asset] = { amount: 0, avgPrice: 0 };
        }

        // Calculate new average price
        const currentValue = this.portfolio[asset].amount * this.portfolio[asset].avgPrice;
        const newValue = currentValue + total;
        const newAmount = this.portfolio[asset].amount + amount;

        this.portfolio[asset] = {
            amount: newAmount,
            avgPrice: newValue / newAmount
        };

        return { success: true };
    }

    sellAsset(pair, amount, price) {
        const [asset, currency] = pair.split('/');
        const total = amount * price;

        if (!this.portfolio[asset] || this.portfolio[asset].amount < amount) {
            throw new Error('Insufficient assets');
        }

        this.balance += total;
        this.portfolio[asset].amount -= amount;

        // Remove asset from portfolio if amount is 0
        if (this.portfolio[asset].amount === 0) {
            delete this.portfolio[asset];
        }

        return { success: true };
    }
}

// Generate realistic order book
function generateOrderBook(pair, currentPrice) {
    const asks = [];
    const bids = [];
    const spread = currentPrice * 0.001; // 0.1% spread

    // Generate asks (sell orders)
    for (let i = 0; i < 15; i++) {
        const price = currentPrice + spread + (i * spread * 0.5);
        const amount = Math.random() * 10 + 0.1;
        const total = price * amount;
        asks.push([price, amount, total]);
    }

    // Generate bids (buy orders)
    for (let i = 0; i < 15; i++) {
        const price = currentPrice - spread - (i * spread * 0.5);
        const amount = Math.random() * 10 + 0.1;
        const total = price * amount;
        bids.push([price, amount, total]);
    }

    return { asks, bids };
}

// Simulate price movements
function updatePrices() {
    Object.entries(markets).forEach(([pair, data]) => {
        // Random walk with mean reversion
        const change = (Math.random() - 0.5) * data.volatility;
        const meanReversion = (priceHistory[pair][0] - data.price) * 0.001;

        data.price += change + meanReversion;
        data.price = Math.max(data.price, 0.01); // Prevent negative prices

        // Calculate percentage change from initial price
        const initialPrice = priceHistory[pair][0];
        data.change = ((data.price - initialPrice) / initialPrice) * 100;

        // Keep price history
        priceHistory[pair].push(data.price);
        if (priceHistory[pair].length > 1000) {
            priceHistory[pair].shift();
        }
    });
}

// Broadcast price updates to all connected clients
function broadcastPriceUpdates() {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            Object.entries(markets).forEach(([pair, data]) => {
                if (!client.subscribedPair || client.subscribedPair === pair) {
                    client.send(JSON.stringify({
                        type: 'price_update',
                        pair: pair,
                        price: data.price,
                        change: data.change
                    }));
                }
            });
        }
    });
}

// Broadcast order book updates
function broadcastOrderBook(pair) {
    const orderbook = generateOrderBook(pair, markets[pair].price);

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN && client.subscribedPair === pair) {
            client.send(JSON.stringify({
                type: 'orderbook',
                pair: pair,
                orderbook: orderbook
            }));
        }
    });
}

// WebSocket connection handler
wss.on('connection', (ws) => {
    console.log('New client connected');

    // Assign user account
    const userId = Date.now().toString();
    if (!users.has(userId)) {
        users.set(userId, new UserAccount(userId));
    }
    ws.userId = userId;
    ws.subscribedPair = 'BTC/USD'; // Default subscription

    // Send initial market data
    ws.send(JSON.stringify({
        type: 'markets',
        markets: markets
    }));

    // Send initial orderbook
    const orderbook = generateOrderBook(ws.subscribedPair, markets[ws.subscribedPair].price);
    ws.send(JSON.stringify({
        type: 'orderbook',
        pair: ws.subscribedPair,
        orderbook: orderbook
    }));

    // Handle messages from client
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            switch(data.type) {
                case 'subscribe':
                    ws.subscribedPair = data.pair;
                    const ob = generateOrderBook(data.pair, markets[data.pair].price);
                    ws.send(JSON.stringify({
                        type: 'orderbook',
                        pair: data.pair,
                        orderbook: ob
                    }));
                    break;

                case 'trade':
                    handleTrade(ws, data);
                    break;
            }
        } catch (error) {
            console.error('Error handling message:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: error.message
            }));
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// Handle trade execution
function handleTrade(ws, data) {
    const user = users.get(ws.userId);

    if (!user) {
        ws.send(JSON.stringify({
            type: 'trade_error',
            message: 'User account not found'
        }));
        return;
    }

    try {
        if (data.tradeType === 'buy') {
            user.buyAsset(data.pair, data.amount, data.price);
        } else {
            user.sellAsset(data.pair, data.amount, data.price);
        }

        ws.send(JSON.stringify({
            type: 'trade_success',
            tradeType: data.tradeType,
            pair: data.pair,
            amount: data.amount,
            price: data.price,
            balance: user.balance,
            portfolio: user.portfolio
        }));
    } catch (error) {
        ws.send(JSON.stringify({
            type: 'trade_error',
            message: error.message
        }));
    }
}

// API Routes
app.get('/api/markets', (req, res) => {
    res.json(markets);
});

app.get('/api/orderbook/:pair', (req, res) => {
    const pair = req.params.pair.replace('-', '/');

    if (!markets[pair]) {
        return res.status(404).json({ error: 'Market not found' });
    }

    const orderbook = generateOrderBook(pair, markets[pair].price);
    res.json(orderbook);
});

app.get('/api/history/:pair', (req, res) => {
    const pair = req.params.pair.replace('-', '/');

    if (!priceHistory[pair]) {
        return res.status(404).json({ error: 'Market not found' });
    }

    res.json({
        pair: pair,
        prices: priceHistory[pair].slice(-100)
    });
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start price simulation
setInterval(() => {
    updatePrices();
}, 1000); // Update every second

// Broadcast updates
setInterval(() => {
    broadcastPriceUpdates();
}, 500); // Broadcast every 500ms

// Update order books
setInterval(() => {
    Object.keys(markets).forEach(pair => {
        broadcastOrderBook(pair);
    });
}, 2000); // Update order books every 2 seconds

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`\n🚀 Trading Platform Server Started`);
    console.log(`   URL: http://localhost:${PORT}`);
    console.log(`   Markets: ${Object.keys(markets).length} pairs available`);
    console.log(`   WebSocket: Active`);
    console.log(`\n   Available markets:`);
    Object.entries(markets).forEach(([pair, data]) => {
        console.log(`   - ${pair}: $${data.price.toFixed(2)}`);
    });
    console.log('\n');
});

module.exports = { app, server };
