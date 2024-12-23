import axios from 'axios';
import { CryptoService } from './cryptoService';
interface KlineData {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteVolume: string;
  trades: number;
  buyBaseVolume: string;
  buyQuoteVolume: string;
  ignore: string;
}

export class MultiSymbolService {
  private baseUrl = 'https://api.binance.com';
  private totalSymbols = 0;
  private processedSymbols = 0;
  private cryptoService: CryptoService;
  private cache: Map<string, { data: KlineData[], timestamp: number }> = new Map();
  private CACHE_DURATION = 5 * 60 * 1000; // 缓存5分钟
  private BATCH_SIZE = 20; // 增加到20个并发请求

  constructor() {
    this.cryptoService = new CryptoService();
  }

  // 添加缓存相关方法
  private getCacheKey(symbol: string, interval: string, date: Date): string {
    return `${symbol}-${interval}-${date.toISOString().split('T')[0]}`;
  }

  private async getKlinesWithCache(symbol: string, interval: string, date: Date): Promise<KlineData[]> {
    const cacheKey = this.getCacheKey(symbol, interval, date);
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    const klines = await this.getKlinesForDate(symbol, interval, date);
    this.cache.set(cacheKey, {
      data: klines,
      timestamp: Date.now()
    });

    return klines;
  }

  // 获取所有USDT交易对
  async getAllSymbols(): Promise<string[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/v3/exchangeInfo`);
      const symbols = response.data.symbols
        .filter((s: any) => s.quoteAsset === 'USDT' && s.status === 'TRADING')
        .map((s: any) => s.symbol)
      return symbols;
    } catch (error) {
      console.error('获取交易对列表失败:', error);
      throw error;
    }
  }

  // 获取指定日期的K线数据
  private async getKlinesForDate(symbol: string, interval: string, targetDate: Date): Promise<KlineData[]> {
    try {
      // 将目标日期转换为UTC时间
      const targetDay = new Date(targetDate);
      
      // 计算开始和结束时间
      const endTime = new Date(targetDay);
      // 对于分钟级别的K线，我们需要获取当天所有数据
      if (interval.includes('m')) {
        endTime.setHours(23, 59, 59, 999);
      }
      
      const startTime = new Date(targetDay);
      // 根据不同的时间间隔设置不同的历史数据长度
      if (interval.includes('m')) {
        startTime.setDate(startTime.getDate() - 3); // 对于分钟级别，获取3天数据足够
      } else if (interval.includes('h')) {
        startTime.setDate(startTime.getDate() - 7); // 对于小时级别，获取7天数据
      } else {
        startTime.setDate(startTime.getDate() - 60); // 对于日线及以上，获取60天数据
      }
      
      console.log(`获取${symbol}的K线数据:`, {
        symbol,
        interval,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        targetDay: targetDay.toISOString()
      });

      // 获取K线数据
      const klines = await this.cryptoService.getKlines(
        symbol,
        interval,
        1000,
        startTime.getTime(),
        endTime.getTime()
      );

      // 调试信息
      console.log(`${symbol} K线数据:`, {
        数据长度: klines.length,
        开始时间: new Date(klines[0]?.openTime).toISOString(),
        结束时间: new Date(klines[klines.length - 1]?.openTime).toISOString(),
        首个K线价格: klines[0]?.close,
        最后K线价格: klines[klines.length - 1]?.close
      });

      return klines;
    } catch (error) {
      console.error(`获取${symbol}的K线数据失败:`, error);
      throw error;
    }
  }

  // 获取指定日期所有币种的背离情况
  async getDivergenceStats(date: Date, interval: string = '1d'): Promise<{
    topDivergences: Array<{symbol: string, price: string, time: string}>,
    bottomDivergences: Array<{symbol: string, price: string, time: string}>,
    timestamp: number,
    totalSymbols: number,
    processedSymbols: number,
    debug?: any
  }> {
    try {
      const symbols = await this.getAllSymbols();
      this.totalSymbols = symbols.length;
      this.processedSymbols = 0;

      const topDivergences: Array<{symbol: string, price: string, time: string}> = [];
      const bottomDivergences: Array<{symbol: string, price: string, time: string}> = [];
      let debug: any;

      // 计算目标日期的开始和结束时间
      const targetDayStart = new Date(date);
      targetDayStart.setHours(0, 0, 0, 0);
      const targetDayEnd = new Date(date);
      targetDayEnd.setHours(23, 59, 59, 999);

      // 使用更大的批处理大小
      for (let i = 0; i < symbols.length; i += this.BATCH_SIZE) {
        const batch = symbols.slice(i, i + this.BATCH_SIZE);
        const promises = batch.map(async (symbol) => {
          try {
            // 使用缓存获取K线数据
            const klines = await this.getKlinesWithCache(symbol, interval, date);
            if (klines.length === 0) {
              return;
            }

            const result = this.cryptoService.calculateIndicators(klines);
            
            for (let i = 0; i < klines.length; i++) {
              const klineTime = new Date(klines[i].openTime);
              if (klineTime.getTime() >= targetDayStart.getTime() && 
                  klineTime.getTime() <= targetDayEnd.getTime()) {
                if (result.topDivergence[i]) {
                  topDivergences.push({
                    symbol,
                    price: klines[i].close,
                    time: klineTime.toISOString()
                  });
                }

                if (result.bottomDivergence[i]) {
                  bottomDivergences.push({
                    symbol,
                    price: klines[i].close,
                    time: klineTime.toISOString()
                  });
                }
              }
            }

            if (symbol === 'BTCUSDT') {
              debug = {
                klines: klines.slice(-20),
                topDivergence: result.topDivergence.slice(-20),
                bottomDivergence: result.bottomDivergence.slice(-20),
                klineTimes: klines.slice(-20).map(k => new Date(k.openTime).toISOString()),
                date: date.toISOString(),
                targetTimestamp: date.getTime(),
                j: result.j?.slice(-20),
                j1: result.j1?.slice(-20)
              };
            }

            this.processedSymbols++;
          } catch (error) {
            console.error(`处理 ${symbol} 失败:`, error);
          }
        });

        await Promise.all(promises);
        // 减少等待时间
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // 排序保持不变...
      topDivergences.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      bottomDivergences.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

      return {
        topDivergences,
        bottomDivergences,
        timestamp: Date.now(),
        totalSymbols: this.totalSymbols,
        processedSymbols: this.processedSymbols,
        debug
      };
    } catch (error) {
      console.error('获取背离统计失败:', error);
      throw error;
    }
  }
}