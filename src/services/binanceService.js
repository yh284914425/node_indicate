const Binance = require('node-binance-api');
const binance = new Binance();

class BinanceService {
    async getKlines(symbol, interval, limit = 100) {
        try {
            const klines = await binance.futuresCandles(symbol, interval, {limit});
            return klines.map(k => ({
                time: k[0],
                open: parseFloat(k[1]),
                high: parseFloat(k[2]),
                low: parseFloat(k[3]),
                close: parseFloat(k[4]),
                volume: parseFloat(k[5])
            }));
        } catch (error) {
            console.error(`获取${symbol} K线数据失败:`, error);
            throw error;
        }
    }
}

module.exports = new BinanceService(); 