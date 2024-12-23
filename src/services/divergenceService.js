
class DivergenceService {
    // 技术指标计算函数
    MA(data, period) {
        const result = [];
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

    EMA(data, period) {
        const k = 2 / (period + 1);
        const result = [];
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

    SMA(data, n, m) {
        const result = [];
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

    HHV(data, period) {
        const result = [];
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

    LLV(data, period) {
        const result = [];
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

    CROSS(a1, b1, a2, b2) {
        return a1 <= b1 && a2 > b2;
    }

    checkDivergence(klines) {
        const high = klines.map(k => k.high);
        const low = klines.map(k => k.low);
        const close = klines.map(k => k.close);
        
        const llv = this.LLV(low, 34);
        const hhv = this.HHV(high, 34);
        const lowv = this.EMA(llv, 3);
        const highv = this.EMA(hhv, 3);
        
        const rsv = [];
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
        
        let topDivergence = false;
        let bottomDivergence = false;
        
        // 只检查最后一根K线是否形成背离
        const i = klines.length - 1;
        if (i >= 34) {
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
                        bottomDivergence = true;
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
                        topDivergence = true;
                    }
                }
            }
        }
        
        return {
            bullishDivergence: bottomDivergence,
            bearishDivergence: topDivergence,
            indicators: { j, j1 } // 返回指标数据，方便调试
        };
    }
}

module.exports = new DivergenceService(); 