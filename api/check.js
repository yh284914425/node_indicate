const binanceService = require('../src/services/binanceService');
const divergenceService = require('../src/services/divergenceService');
const telegramService = require('../src/services/telegramService');
const { symbols } = require('../src/config/symbols');
const { timeframes } = require('../src/config/timeframes');

async function checkDivergenceForSymbol(symbol, interval) {
    try {
        const klines = await binanceService.getKlines(symbol, interval, 100);
        const result = divergenceService.checkDivergence(klines);
        
        const currentPrice = klines[klines.length-1].close;
        
        if (result.bullishDivergence) {
            const message = `🚨 ${symbol} ${interval} 底背离提醒\n` +
                          `当前价格: ${currentPrice}\n` +
                          `时间: ${new Date().toLocaleString('zh-CN')}`;
            console.log(message);
            await telegramService.sendMessage(message);
        }
        
        if (result.bearishDivergence) {
            const message = `🚨 ${symbol} ${interval} 顶背离提醒\n` +
                          `当前价格: ${currentPrice}\n` +
                          `时间: ${new Date().toLocaleString('zh-CN')}`;
            console.log(message);
            await telegramService.sendMessage(message);
        }
    } catch (error) {
        console.error(`检查 ${symbol} ${interval} 周期背离时出错:`, error);
        throw error;
    }
}

module.exports = async (req, res) => {
    try {
        const startTime = Date.now();
        const results = [];
        
        for (const symbol of symbols) {
            for (const {interval} of timeframes) {
                try {
                    await checkDivergenceForSymbol(symbol, interval);
                    results.push({
                        symbol,
                        interval,
                        status: 'success'
                    });
                } catch (error) {
                    results.push({
                        symbol,
                        interval,
                        status: 'error',
                        error: error.message
                    });
                }
                // 添加延时避免触发API限制
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        const duration = Date.now() - startTime;
        
        res.status(200).json({
            success: true,
            duration: `${duration/1000}秒`,
            timestamp: new Date().toISOString(),
            results
        });
    } catch (error) {
        console.error('检查过程发生错误:', error);
        await telegramService.sendMessage(`🔥 程序发生错误: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
}; 