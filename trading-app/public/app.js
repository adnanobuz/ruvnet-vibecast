// Trading App Frontend
class TradingApp {
    constructor() {
        this.ws = null;
        this.selectedPair = 'BTC/USD';
        this.currentPrice = 0;
        this.balance = 10000;
        this.portfolio = {};
        this.tradeHistory = [];
        this.priceHistory = [];
        this.tradeType = 'buy';
        this.markets = {};

        this.init();
    }

    init() {
        this.connectWebSocket();
        this.setupEventListeners();
        this.setupChart();
        this.updateUI();
    }

    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        this.ws = new WebSocket(`${protocol}//${window.location.host}`);

        this.ws.onopen = () => {
            console.log('Connected to server');
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleServerMessage(data);
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        this.ws.onclose = () => {
            console.log('Disconnected from server. Reconnecting...');
            setTimeout(() => this.connectWebSocket(), 3000);
        };
    }

    handleServerMessage(data) {
        switch(data.type) {
            case 'markets':
                this.markets = data.markets;
                this.renderMarkets();
                break;
            case 'price_update':
                this.updatePrice(data);
                break;
            case 'orderbook':
                this.updateOrderBook(data.orderbook);
                break;
            case 'trade_success':
                this.handleTradeSuccess(data);
                break;
            case 'trade_error':
                alert(data.message);
                break;
        }
    }

    setupEventListeners() {
        // Trade tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.tradeType = e.target.dataset.type;
                this.updateTradeButton();
            });
        });

        // Trade inputs
        const amountInput = document.getElementById('tradeAmount');
        const priceInput = document.getElementById('tradePrice');

        amountInput.addEventListener('input', () => this.calculateTotal());
        priceInput.addEventListener('input', () => this.calculateTotal());

        // Trade button
        document.getElementById('tradeBtn').addEventListener('click', () => this.executeTrade());

        // Auto-fill market price
        priceInput.addEventListener('focus', () => {
            if (!priceInput.value) {
                priceInput.value = this.currentPrice.toFixed(2);
                this.calculateTotal();
            }
        });
    }

    setupChart() {
        this.canvas = document.getElementById('priceChart');
        this.ctx = this.canvas.getContext('2d');

        // Set canvas size
        const resizeCanvas = () => {
            const container = this.canvas.parentElement;
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight - 80;
            this.drawChart();
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Start chart updates
        setInterval(() => this.drawChart(), 100);
    }

    drawChart() {
        if (!this.ctx || this.priceHistory.length < 2) return;

        const { width, height } = this.canvas;
        const ctx = this.ctx;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Calculate bounds
        const prices = this.priceHistory.slice(-100);
        const maxPrice = Math.max(...prices);
        const minPrice = Math.min(...prices);
        const priceRange = maxPrice - minPrice || 1;

        // Draw grid
        ctx.strokeStyle = '#2b3139';
        ctx.lineWidth = 1;

        for (let i = 0; i < 5; i++) {
            const y = (height / 4) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();

            // Price labels
            const price = maxPrice - (priceRange / 4) * i;
            ctx.fillStyle = '#848e9c';
            ctx.font = '11px sans-serif';
            ctx.fillText(`$${price.toFixed(2)}`, 5, y - 5);
        }

        // Draw price line
        ctx.strokeStyle = '#3861fb';
        ctx.lineWidth = 2;
        ctx.beginPath();

        const pointWidth = width / (prices.length - 1);

        prices.forEach((price, index) => {
            const x = index * pointWidth;
            const y = height - ((price - minPrice) / priceRange) * height;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // Draw gradient fill
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, 'rgba(56, 97, 251, 0.3)');
        gradient.addColorStop(1, 'rgba(56, 97, 251, 0)');

        ctx.fillStyle = gradient;
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fill();
    }

    renderMarkets() {
        const container = document.getElementById('marketList');
        container.innerHTML = '';

        Object.entries(this.markets).forEach(([pair, data]) => {
            const item = document.createElement('div');
            item.className = `market-item ${pair === this.selectedPair ? 'active' : ''}`;

            const change = data.change || 0;
            const changeClass = change >= 0 ? 'positive' : 'negative';
            const changeSymbol = change >= 0 ? '+' : '';

            item.innerHTML = `
                <div class="market-pair">${pair}</div>
                <div class="market-price">$${data.price.toFixed(2)}</div>
                <div class="market-change ${changeClass}">${changeSymbol}${change.toFixed(2)}%</div>
            `;

            item.addEventListener('click', () => this.selectMarket(pair));
            container.appendChild(item);
        });
    }

    selectMarket(pair) {
        this.selectedPair = pair;
        this.priceHistory = [];
        this.renderMarkets();
        this.updateUI();

        // Request orderbook for selected pair
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'subscribe',
                pair: pair
            }));
        }
    }

    updatePrice(data) {
        if (data.pair !== this.selectedPair) return;

        this.currentPrice = data.price;
        this.priceHistory.push(data.price);

        // Keep only last 100 prices
        if (this.priceHistory.length > 100) {
            this.priceHistory.shift();
        }

        // Update market data
        if (this.markets[data.pair]) {
            this.markets[data.pair].price = data.price;
            this.markets[data.pair].change = data.change;
        }

        this.updatePriceDisplay();
        this.renderMarkets();
    }

    updatePriceDisplay() {
        document.getElementById('selectedPair').textContent = this.selectedPair;
        document.getElementById('currentPrice').textContent = `$${this.currentPrice.toFixed(2)}`;

        const change = this.markets[this.selectedPair]?.change || 0;
        const priceChangeEl = document.getElementById('priceChange');
        priceChangeEl.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
        priceChangeEl.className = `price-change ${change >= 0 ? 'positive' : 'negative'}`;

        // Update asset unit
        const asset = this.selectedPair.split('/')[0];
        document.getElementById('assetUnit').textContent = asset;
    }

    updateOrderBook(orderbook) {
        this.renderOrderBook(orderbook);
    }

    renderOrderBook(orderbook) {
        const asksContainer = document.getElementById('asks');
        const bidsContainer = document.getElementById('bids');

        // Render asks (sell orders)
        asksContainer.innerHTML = orderbook.asks.slice(0, 10).map(order => {
            const [price, amount, total] = order;
            return `
                <div class="order-row" style="--depth: ${Math.min(amount * 10, 100)}%">
                    <span>${price.toFixed(2)}</span>
                    <span>${amount.toFixed(4)}</span>
                    <span>${total.toFixed(2)}</span>
                </div>
            `;
        }).join('');

        // Render bids (buy orders)
        bidsContainer.innerHTML = orderbook.bids.slice(0, 10).map(order => {
            const [price, amount, total] = order;
            return `
                <div class="order-row" style="--depth: ${Math.min(amount * 10, 100)}%">
                    <span>${price.toFixed(2)}</span>
                    <span>${amount.toFixed(4)}</span>
                    <span>${total.toFixed(2)}</span>
                </div>
            `;
        }).join('');

        // Calculate and display spread
        if (orderbook.asks.length > 0 && orderbook.bids.length > 0) {
            const spread = orderbook.asks[0][0] - orderbook.bids[0][0];
            document.getElementById('spreadValue').textContent = `Spread: $${spread.toFixed(2)}`;
        }
    }

    calculateTotal() {
        const amount = parseFloat(document.getElementById('tradeAmount').value) || 0;
        const price = parseFloat(document.getElementById('tradePrice').value) || this.currentPrice;
        const total = amount * price;

        document.getElementById('tradeTotal').value = total.toFixed(2);
    }

    updateTradeButton() {
        const btn = document.getElementById('tradeBtn');
        const asset = this.selectedPair.split('/')[0];

        if (this.tradeType === 'buy') {
            btn.textContent = `Buy ${asset}`;
            btn.className = 'trade-btn buy-btn';
        } else {
            btn.textContent = `Sell ${asset}`;
            btn.className = 'trade-btn sell-btn';
        }
    }

    executeTrade() {
        const amount = parseFloat(document.getElementById('tradeAmount').value);
        const price = parseFloat(document.getElementById('tradePrice').value) || this.currentPrice;

        if (!amount || amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        const trade = {
            type: 'trade',
            tradeType: this.tradeType,
            pair: this.selectedPair,
            amount: amount,
            price: price
        };

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(trade));
        }
    }

    handleTradeSuccess(data) {
        this.balance = data.balance;
        this.portfolio = data.portfolio;

        // Add to trade history
        this.tradeHistory.unshift({
            type: data.tradeType,
            pair: data.pair,
            amount: data.amount,
            price: data.price,
            time: new Date()
        });

        // Keep only last 20 trades
        if (this.tradeHistory.length > 20) {
            this.tradeHistory.pop();
        }

        this.updateUI();

        // Clear inputs
        document.getElementById('tradeAmount').value = '';
        document.getElementById('tradePrice').value = '';
        document.getElementById('tradeTotal').value = '';
    }

    updateUI() {
        this.updateBalance();
        this.updatePortfolio();
        this.updateTradeHistory();
    }

    updateBalance() {
        document.getElementById('balance').textContent = `$${this.balance.toFixed(2)}`;

        // Calculate P&L
        let totalValue = this.balance;
        Object.entries(this.portfolio).forEach(([asset, data]) => {
            const market = Object.keys(this.markets).find(m => m.startsWith(asset + '/'));
            if (market && this.markets[market]) {
                totalValue += data.amount * this.markets[market].price;
            }
        });

        const pnl = totalValue - 10000;
        const pnlEl = document.getElementById('pnl');
        pnlEl.textContent = `${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`;
        pnlEl.style.color = pnl >= 0 ? 'var(--green)' : 'var(--red)';
    }

    updatePortfolio() {
        const container = document.getElementById('portfolioList');

        if (Object.keys(this.portfolio).length === 0) {
            container.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 20px;">No positions</div>';
            return;
        }

        container.innerHTML = Object.entries(this.portfolio).map(([asset, data]) => {
            const market = Object.keys(this.markets).find(m => m.startsWith(asset + '/'));
            const currentPrice = market && this.markets[market] ? this.markets[market].price : data.avgPrice;
            const value = data.amount * currentPrice;
            const pnl = value - (data.amount * data.avgPrice);
            const pnlPercent = (pnl / (data.amount * data.avgPrice)) * 100;

            return `
                <div class="portfolio-item">
                    <div class="portfolio-header">
                        <span class="portfolio-asset">${asset}</span>
                        <span class="portfolio-value ${pnl >= 0 ? 'positive' : 'negative'}">
                            ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} (${pnlPercent.toFixed(2)}%)
                        </span>
                    </div>
                    <div class="portfolio-details">
                        <div>Amount: ${data.amount.toFixed(4)}</div>
                        <div>Avg: $${data.avgPrice.toFixed(2)}</div>
                        <div>Current: $${currentPrice.toFixed(2)}</div>
                        <div>Value: $${value.toFixed(2)}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateTradeHistory() {
        const container = document.getElementById('tradesList');

        if (this.tradeHistory.length === 0) {
            container.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 20px;">No trades yet</div>';
            return;
        }

        container.innerHTML = this.tradeHistory.map(trade => {
            const timeStr = trade.time.toLocaleTimeString();
            return `
                <div class="trade-item">
                    <div class="trade-header">
                        <span class="trade-type ${trade.type}">${trade.type.toUpperCase()}</span>
                        <span class="trade-time">${timeStr}</span>
                    </div>
                    <div class="trade-details">
                        ${trade.pair} - ${trade.amount.toFixed(4)} @ $${trade.price.toFixed(2)}
                    </div>
                </div>
            `;
        }).join('');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TradingApp();
});
