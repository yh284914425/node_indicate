const schedule = require('node-schedule');
const binanceService = require('./services/binanceService');
const divergenceService = require('./services/divergenceService');
const telegramService = require('./services/telegramService');
const { timeframes } = require('./config/timeframes');
const { symbols } = require('./config/symbols');

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
                          `当前价��: ${currentPrice}\n` +
                          `时间: ${new Date().toLocaleString('zh-CN')}`;
            console.log(message);
            await telegramService.sendMessage(message);
        }
    } catch (error) {
        console.error(`检查 ${symbol} ${interval} 周期背离时出错:`, error);
    }
}

function getSchedulePattern(interval) {
    switch(interval) {
        case '1m':
            return '* * * * *';      // 每分钟
        case '15m':
            return '*/5 * * * *';    // 每5分钟
        case '30m':
            return '*/10 * * * *';   // 每10分钟
        case '1h':
            return '*/15 * * * *';   // 每15分钟
        case '2h':
        case '4h':
            return '*/30 * * * *';   // 每30分钟
        case '1d':
            return '0 * * * *';      // 每小时
        default:
            return '*/5 * * * *';
    }
}

function startMonitoring() {
    timeframes.forEach(({interval}) => {
        const schedulePattern = getSchedulePattern(interval);
        
        schedule.scheduleJob(schedulePattern, async () => {
            for (const symbol of symbols) {
                await checkDivergenceForSymbol(symbol, interval);
                // 增加延时，避免触发API限制
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        });
    });
    
    console.log('开始监控以下币种:', symbols.join(', '));
    console.log('监控的时间周期:', timeframes.map(t => t.interval).join(', '));
}

startMonitoring();

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
    console.error('未捕获的异常:', error);
    telegramService.sendMessage(`🔥 程序发生错误: ${error.message}`);
});

process.on('unhandledRejection', (error) => {
    console.error('未处理的Promise拒绝:', error);
    telegramService.sendMessage(`🔥 程序发生错误: ${error.message}`);
}); 