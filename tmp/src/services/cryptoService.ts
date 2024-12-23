import axios from 'axios';

export interface KlineData {
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

export class CryptoService {
  private baseUrl = 'https://api.binance.com';

  // 获取K线数据
  async getKlines(
    symbol: string, 
    interval: string, 
    limit: number = 1000,
    startTime?: number,
    endTime?: number
  ): Promise<KlineData[]> {
    try {
      const params: any = {
        symbol,
        interval,
        limit
      }
      
      if (startTime) params.startTime = startTime
      if (endTime) params.endTime = endTime

      const response = await axios.get(`${this.baseUrl}/api/v3/klines`, { params })

      return response.data.map((k: any[]) => ({
        openTime: k[0],
        open: k[1],
        high: k[2],
        low: k[3],
        close: k[4],
        volume: k[5],
        closeTime: k[6],
        quoteVolume: k[7],
        trades: k[8],
        buyBaseVolume: k[9],
        buyQuoteVolume: k[10],
        ignore: k[11]
      }));
    } catch (error) {
      console.error(`获取K线数据失败 ${symbol}:`, error);
      throw error;
    }
  }

  // 技术指标计算函数
  private MA(data: number[], period: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        result.push(0);
        continue;
      }
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j];
      }
      result.push(sum / period);
    }
    return result;
  }

  private EMA(data: number[], period: number): number[] {
    const k = 2 / (period + 1);
    const result: number[] = [];
    let ema = data[0];
    
    for (let i = 0; i < data.length; i++) {
      if (i === 0) {
        result.push(data[0]);
      } else {
        ema = data[i] * k + ema * (1 - k);
        result.push(ema);
      }
    }
    return result;
  }

  private SMA(data: number[], n: number, m: number): number[] {
    const result: number[] = [];
    let sma = data[0];
    
    for (let i = 0; i < data.length; i++) {
      if (i === 0) {
        result.push(data[0]);
      } else {
        sma = (m * data[i] + (n - m) * result[i-1]) / n;
        result.push(sma);
      }
    }
    return result;
  }

  private HHV(data: number[], period: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < data.length; i++) {
      let max = data[i];
      for (let j = Math.max(0, i - period + 1); j <= i; j++) {
        if (data[j] > max) {
          max = data[j];
        }
      }
      result.push(max);
    }
    return result;
  }

  private LLV(data: number[], period: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < data.length; i++) {
      let min = data[i];
      for (let j = Math.max(0, i - period + 1); j <= i; j++) {
        if (data[j] < min) {
          min = data[j];
        }
      }
      result.push(min);
    }
    return result;
  }

  private CROSS(a1: number, b1: number, a2: number, b2: number): boolean {
    return a1 <= b1 && a2 > b2;
  }

  // 计算技术指标
  calculateIndicators(klines: KlineData[]): {
    j: number[],
    j1: number[],
    topDivergence: boolean[],
    bottomDivergence: boolean[]
  } {
    const high = klines.map(k => parseFloat(k.high));
    const low = klines.map(k => parseFloat(k.low));
    const close = klines.map(k => parseFloat(k.close));
    
    const llv = this.LLV(low, 34);
    const hhv = this.HHV(high, 34);
    const lowv = this.EMA(llv, 3);
    const highv = this.EMA(hhv, 3);
    
    const rsv: number[] = [];
    for (let i = 0; i < klines.length; i++) {
      if (highv[i] === lowv[i]) {
        rsv[i] = 50;
      } else {
        rsv[i] = ((close[i] - lowv[i]) / (highv[i] - lowv[i])) * 100;
      }
    }
    const rsvEma = this.EMA(rsv, 3);
    
    const k = this.SMA(rsvEma, 8, 1);
    const d = this.SMA(k, 6, 1);
    const j = k.map((v, i) => 3 * v - 2 * d[i]);
    const j1 = this.MA(j, 3);
    
    const topDivergence: boolean[] = new Array(klines.length).fill(false);
    const bottomDivergence: boolean[] = new Array(klines.length).fill(false);
    
    for (let i = 34; i < klines.length; i++) {
      const jCrossUpJ1 = this.CROSS(j[i-1], j1[i-1], j[i], j1[i]);
      const j1CrossUpJ = this.CROSS(j1[i-1], j[i-1], j1[i], j[i]);
      
      if (jCrossUpJ1) {
        let lastCrossIndex = -1;
        for (let k = i - 1; k >= 34; k--) {
          if (this.CROSS(j[k-1], j1[k-1], j[k], j1[k])) {
            lastCrossIndex = k;
            break;
          }
        }
        
        if (lastCrossIndex !== -1) {
          if (close[lastCrossIndex] > close[i] &&
              j[i] > j[lastCrossIndex] &&
              j[i] < 20) {
            bottomDivergence[i] = true;
          }
        }
      }
      
      if (j1CrossUpJ) {
        let lastCrossIndex = -1;
        for (let k = i - 1; k >= 34; k--) {
          if (this.CROSS(j1[k-1], j[k-1], j1[k], j[k])) {
            lastCrossIndex = k;
            break;
          }
        }
        
        if (lastCrossIndex !== -1) {
          if (close[lastCrossIndex] < close[i] &&
              j1[lastCrossIndex] > j1[i] &&
              j[i] > 90) {
            topDivergence[i] = true;
          }
        }
      }
    }
    
    return { j, j1, topDivergence, bottomDivergence };
  }
}
