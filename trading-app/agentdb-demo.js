/**
 * AgentDB Demo - Integration with Trading Platform
 *
 * This demo showcases how to use AgentDB for:
 * - Storing and retrieving trading patterns
 * - Learning from successful trades
 * - Building a memory system for trading decisions
 * - Causal reasoning for market analysis
 */

const AgentDB = require('agentdb');

class TradingIntelligence {
    constructor() {
        this.db = new AgentDB({
            dbPath: './trading-data/agentdb',
            dimensions: 1536, // OpenAI embedding dimensions
            enableReasoningBank: true,
            enableSkillLibrary: true
        });

        this.initialized = false;
    }

    async initialize() {
        try {
            await this.db.initialize();
            this.initialized = true;
            console.log('✅ AgentDB initialized for trading intelligence');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize AgentDB:', error.message);
            return false;
        }
    }

    /**
     * Store a successful trading pattern
     */
    async storeTradingPattern(pattern) {
        if (!this.initialized) await this.initialize();

        const memory = {
            id: `trade-${Date.now()}`,
            content: JSON.stringify(pattern),
            metadata: {
                type: 'trading_pattern',
                pair: pattern.pair,
                profitability: pattern.profitLoss,
                timestamp: new Date().toISOString(),
                indicators: pattern.indicators || {}
            }
        };

        try {
            await this.db.store(memory);
            console.log(`📊 Stored trading pattern for ${pattern.pair}`);
            return true;
        } catch (error) {
            console.error('Failed to store pattern:', error);
            return false;
        }
    }

    /**
     * Search for similar successful patterns
     */
    async findSimilarPatterns(currentMarketData, topK = 5) {
        if (!this.initialized) await this.initialize();

        try {
            const query = JSON.stringify(currentMarketData);
            const results = await this.db.search(query, {
                topK: topK,
                filter: {
                    type: 'trading_pattern',
                    profitability: { $gt: 0 } // Only profitable patterns
                }
            });

            console.log(`🔍 Found ${results.length} similar successful patterns`);
            return results;
        } catch (error) {
            console.error('Failed to search patterns:', error);
            return [];
        }
    }

    /**
     * Use ReasoningBank for trading decisions
     */
    async reasonAboutTrade(tradeScenario) {
        if (!this.initialized) await this.initialize();

        try {
            // Store the reasoning process
            const reasoning = {
                scenario: tradeScenario,
                marketConditions: tradeScenario.conditions,
                proposedAction: tradeScenario.action,
                timestamp: new Date().toISOString()
            };

            // Find historical context
            const similarCases = await this.findSimilarPatterns(
                tradeScenario.conditions,
                3
            );

            // Perform causal reasoning
            const decision = {
                action: tradeScenario.action,
                confidence: this.calculateConfidence(similarCases),
                reasoning: this.generateReasoning(similarCases),
                historicalContext: similarCases.map(c => ({
                    pattern: JSON.parse(c.content),
                    similarity: c.score
                }))
            };

            console.log(`🧠 Reasoning complete. Confidence: ${decision.confidence}%`);
            return decision;
        } catch (error) {
            console.error('Failed to reason about trade:', error);
            return null;
        }
    }

    /**
     * Store trading skills and strategies
     */
    async storeStrategy(strategy) {
        if (!this.initialized) await this.initialize();

        try {
            await this.db.storeSkill({
                name: strategy.name,
                description: strategy.description,
                code: strategy.implementation,
                successRate: strategy.successRate || 0,
                metadata: {
                    market: strategy.market,
                    timeframe: strategy.timeframe,
                    riskLevel: strategy.riskLevel
                }
            });

            console.log(`📚 Stored trading strategy: ${strategy.name}`);
            return true;
        } catch (error) {
            console.error('Failed to store strategy:', error);
            return false;
        }
    }

    /**
     * Reflexion: Learn from mistakes
     */
    async learnFromMistake(failedTrade) {
        if (!this.initialized) await this.initialize();

        try {
            const reflection = {
                id: `reflection-${Date.now()}`,
                content: JSON.stringify({
                    trade: failedTrade,
                    loss: failedTrade.loss,
                    mistake: failedTrade.analysis,
                    lesson: failedTrade.lesson
                }),
                metadata: {
                    type: 'reflexion',
                    pair: failedTrade.pair,
                    severity: Math.abs(failedTrade.loss),
                    timestamp: new Date().toISOString()
                }
            };

            await this.db.storeReflexion(reflection);
            console.log(`🔄 Learned from mistake in ${failedTrade.pair}`);
            return true;
        } catch (error) {
            console.error('Failed to store reflexion:', error);
            return false;
        }
    }

    // Helper methods
    calculateConfidence(similarCases) {
        if (similarCases.length === 0) return 30;

        const avgScore = similarCases.reduce((sum, c) => sum + c.score, 0) / similarCases.length;
        const profitableCases = similarCases.filter(c => {
            const pattern = JSON.parse(c.content);
            return pattern.profitLoss > 0;
        }).length;

        const profitRatio = profitableCases / similarCases.length;
        return Math.round((avgScore * 0.6 + profitRatio * 0.4) * 100);
    }

    generateReasoning(similarCases) {
        if (similarCases.length === 0) {
            return "No historical data available for this scenario.";
        }

        const profitable = similarCases.filter(c => {
            const pattern = JSON.parse(c.content);
            return pattern.profitLoss > 0;
        }).length;

        return `Based on ${similarCases.length} similar cases, ${profitable} were profitable. ` +
               `Average similarity score: ${(similarCases.reduce((s, c) => s + c.score, 0) / similarCases.length).toFixed(2)}`;
    }

    /**
     * Get statistics
     */
    async getStatistics() {
        if (!this.initialized) await this.initialize();

        try {
            const stats = await this.db.getStats();
            return {
                totalPatterns: stats.totalMemories || 0,
                totalStrategies: stats.totalSkills || 0,
                totalReflexions: stats.totalReflexions || 0,
                databaseSize: stats.databaseSize || '0 MB'
            };
        } catch (error) {
            console.error('Failed to get statistics:', error);
            return null;
        }
    }
}

// Demo Usage
async function runDemo() {
    console.log('\n🚀 AgentDB Trading Intelligence Demo\n');

    const intelligence = new TradingIntelligence();
    await intelligence.initialize();

    // 1. Store successful trading patterns
    console.log('\n📊 Storing successful trading patterns...');
    await intelligence.storeTradingPattern({
        pair: 'BTC/USD',
        entryPrice: 45000,
        exitPrice: 46500,
        profitLoss: 1500,
        indicators: {
            rsi: 65,
            macd: 'bullish',
            volume: 'high'
        }
    });

    await intelligence.storeTradingPattern({
        pair: 'ETH/USD',
        entryPrice: 2800,
        exitPrice: 2950,
        profitLoss: 150,
        indicators: {
            rsi: 58,
            macd: 'bullish',
            volume: 'medium'
        }
    });

    // 2. Store a trading strategy
    console.log('\n📚 Storing trading strategy...');
    await intelligence.storeStrategy({
        name: 'RSI Reversal',
        description: 'Buy when RSI < 30, sell when RSI > 70',
        implementation: 'function (rsi) { return rsi < 30 ? "BUY" : rsi > 70 ? "SELL" : "HOLD"; }',
        successRate: 0.72,
        market: 'Crypto',
        timeframe: '15m',
        riskLevel: 'medium'
    });

    // 3. Find similar patterns
    console.log('\n🔍 Searching for similar patterns...');
    const currentMarket = {
        pair: 'BTC/USD',
        price: 45200,
        indicators: {
            rsi: 63,
            macd: 'bullish',
            volume: 'high'
        }
    };
    const similar = await intelligence.findSimilarPatterns(currentMarket);

    // 4. Make a trading decision with reasoning
    console.log('\n🧠 Making trading decision with reasoning...');
    const decision = await intelligence.reasonAboutTrade({
        action: 'BUY',
        conditions: currentMarket
    });

    if (decision) {
        console.log(`   Action: ${decision.action}`);
        console.log(`   Confidence: ${decision.confidence}%`);
        console.log(`   Reasoning: ${decision.reasoning}`);
    }

    // 5. Learn from a mistake
    console.log('\n🔄 Learning from a failed trade...');
    await intelligence.learnFromMistake({
        pair: 'SOL/USD',
        entryPrice: 105,
        exitPrice: 98,
        loss: -7,
        analysis: 'Entered too early without confirming support',
        lesson: 'Always wait for confirmation of support levels'
    });

    // 6. Get statistics
    console.log('\n📈 AgentDB Statistics:');
    const stats = await intelligence.getStatistics();
    if (stats) {
        console.log(`   Total Patterns: ${stats.totalPatterns}`);
        console.log(`   Total Strategies: ${stats.totalStrategies}`);
        console.log(`   Total Reflexions: ${stats.totalReflexions}`);
        console.log(`   Database Size: ${stats.databaseSize}`);
    }

    console.log('\n✅ Demo completed!\n');
}

// Run demo if executed directly
if (require.main === module) {
    runDemo().catch(console.error);
}

module.exports = { TradingIntelligence };
