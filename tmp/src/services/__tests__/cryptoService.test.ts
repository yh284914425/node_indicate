import { describe, it, expect } from 'vitest'
import { CryptoService } from '../cryptoService'
import type { KlineData } from '../cryptoService'

describe('Divergence Detection Tests', () => {
  // 创建CryptoService实例
  const cryptoService = new CryptoService()

  // 测试数据生成函数
  function createMockKline(
    openTime: number,
    open: number,
    high: number,
    low: number,
    close: number
  ): KlineData {
    return {
      openTime,
      open: open.toString(),
      high: high.toString(),
      low: low.toString(),
      close: close.toString(),
      volume: "0",
      closeTime: openTime + 900000, // 15分钟
      quoteAssetVolume: "0",
      numberOfTrades: 0,
      takerBuyBaseAssetVolume: "0",
      takerBuyQuoteAssetVolume: "0",
      ignore: "0"
    }
  }

  // 顶背离测试用例
  it('should detect top divergence correctly', () => {
    const klines: KlineData[] = []
    const baseTime = new Date('2024-11-24T00:00:00Z').getTime()
    
    // 创建模拟数据，价格上升但KDJ指标下降
    for (let i = 0; i < 100; i++) {
      const price = 40000 + i * 100 // 价格持续上升
      klines.push(createMockKline(
        baseTime + i * 900000,
        price,
        price + 50,
        price - 50,
        price
      ))
    }

    const result = cryptoService.calculateIndicators(klines)
    
    // 验证在高位是否检测到顶背离
    expect(result.topDivergence.some(x => x)).toBe(true)
    expect(result.j[result.j.length - 1]).toBeGreaterThan(90) // J值应该大于90
  })

  // 底背离测试用例
  it('should detect bottom divergence correctly', () => {
    const klines: KlineData[] = []
    const baseTime = new Date('2024-07-08T00:00:00Z').getTime()
    
    // 创建模拟数据，价格下降但KDJ指标上升
    for (let i = 0; i < 100; i++) {
      const price = 35000 - i * 100 // 价格持续下降
      klines.push(createMockKline(
        baseTime + i * 900000,
        price,
        price + 50,
        price - 50,
        price
      ))
    }

    const result = cryptoService.calculateIndicators(klines)
    
    // 验证在低位是否检测到底背离
    expect(result.bottomDivergence.some(x => x)).toBe(true)
    expect(result.j[result.j.length - 1]).toBeLessThan(20) // J值应该小于20
  })

  // 无背离测试用例
  it('should not detect divergence in normal price movement', () => {
    const klines: KlineData[] = []
    const baseTime = new Date('2024-12-01T00:00:00Z').getTime()
    
    // 创建正常波动的价格数据
    for (let i = 0; i < 100; i++) {
      const price = 40000 + Math.sin(i * 0.1) * 1000
      klines.push(createMockKline(
        baseTime + i * 900000,
        price,
        price + 100,
        price - 100,
        price
      ))
    }

    const result = cryptoService.calculateIndicators(klines)
    
    // 验证没有检测到背离
    expect(result.topDivergence.every(x => !x)).toBe(true)
    expect(result.bottomDivergence.every(x => !x)).toBe(true)
  })

  // 边界条件测试
  it('should handle edge cases properly', () => {
    // 测试空数据
    expect(() => cryptoService.calculateIndicators([])).toThrow()

    // 测试单个数据点
    const singleKline = [createMockKline(Date.now(), 40000, 40100, 39900, 40000)]
    expect(() => cryptoService.calculateIndicators(singleKline)).toThrow()

    // 测试极端价格
    const extremeKlines = [
      createMockKline(Date.now(), 0, 0, 0, 0),
      createMockKline(Date.now() + 900000, 999999, 999999, 999999, 999999)
    ]
    expect(() => cryptoService.calculateIndicators(extremeKlines)).not.toThrow()
  })

  // 特定历史背离测试用例
  describe('Historical Divergence Cases', () => {
    it('should detect top divergence on 2024.11.24', () => {
      const klines: KlineData[] = []
      const baseTime = new Date('2024-11-24T00:00:00Z').getTime()
      
      // 模拟11.24前后的价格走势
      for (let i = 0; i < 200; i++) {
        const timeOffset = i * 900000 // 15分钟
        let price
        if (i < 150) {
          price = 40000 + i * 50 // 上升趋势
        } else {
          price = 47500 - (i - 150) * 30 // 开始回落
        }
        klines.push(createMockKline(
          baseTime - (200 - i) * 900000, // 从更早的时间开始
          price,
          price + 100,
          price - 100,
          price
        ))
      }

      const result = cryptoService.calculateIndicators(klines)
      const lastIndex = result.topDivergence.length - 1
      
      // 验证11.24附近是否有顶背离
      expect(result.topDivergence.slice(lastIndex - 10, lastIndex).some(x => x)).toBe(true)
      expect(result.j[lastIndex]).toBeGreaterThan(90)
    })

    it('should detect top divergence on 2024.11.01', () => {
      const klines: KlineData[] = []
      const baseTime = new Date('2024-11-01T00:00:00Z').getTime()
      
      // 模拟11.01前后的价格走势
      for (let i = 0; i < 200; i++) {
        const timeOffset = i * 900000
        let price
        if (i < 150) {
          price = 38000 + i * 40
        } else {
          price = 44000 - (i - 150) * 25
        }
        klines.push(createMockKline(
          baseTime - (200 - i) * 900000,
          price,
          price + 80,
          price - 80,
          price
        ))
      }

      const result = cryptoService.calculateIndicators(klines)
      const lastIndex = result.topDivergence.length - 1
      
      expect(result.topDivergence.slice(lastIndex - 10, lastIndex).some(x => x)).toBe(true)
      expect(result.j[lastIndex]).toBeGreaterThan(90)
    })

    it('should detect bottom divergence on 2024.07.08', () => {
      const klines: KlineData[] = []
      const baseTime = new Date('2024-07-08T00:00:00Z').getTime()
      
      // 模拟07.08前后的价格走势
      for (let i = 0; i < 200; i++) {
        const timeOffset = i * 900000
        let price
        if (i < 150) {
          price = 35000 - i * 30 // 下降趋势
        } else {
          price = 30500 + (i - 150) * 20 // 开始反弹
        }
        klines.push(createMockKline(
          baseTime - (200 - i) * 900000,
          price,
          price + 70,
          price - 70,
          price
        ))
      }

      const result = cryptoService.calculateIndicators(klines)
      const lastIndex = result.bottomDivergence.length - 1
      
      expect(result.bottomDivergence.slice(lastIndex - 10, lastIndex).some(x => x)).toBe(true)
      expect(result.j[lastIndex]).toBeLessThan(20)
    })
  })

  // KDJ指标计算测试
  describe('KDJ Indicator Calculation', () => {
    it('should calculate KDJ values correctly', () => {
      const klines: KlineData[] = []
      const baseTime = Date.now()
      
      // 创建一个简单的上涨-下跌-上涨周期
      for (let i = 0; i < 50; i++) {
        let price
        if (i < 20) {
          price = 40000 + i * 100 // 上涨
        } else if (i < 35) {
          price = 42000 - (i - 20) * 150 // 下跌
        } else {
          price = 39750 + (i - 35) * 120 // 再次上涨
        }
        klines.push(createMockKline(
          baseTime + i * 900000,
          price,
          price + 50,
          price - 50,
          price
        ))
      }

      const result = cryptoService.calculateIndicators(klines)
      
      // 验证KDJ指标的基本特性
      expect(result.k).toBeDefined()
      expect(result.d).toBeDefined()
      expect(result.j).toBeDefined()
      
      // 验证KDJ的取值范围
      expect(Math.max(...result.j)).toBeLessThanOrEqual(100)
      expect(Math.min(...result.j)).toBeGreaterThanOrEqual(0)
      
      // 验证KDJ指标的计算逻辑
      for (let i = 0; i < result.j.length; i++) {
        expect(result.j[i]).toBe(3 * result.k[i] - 2 * result.d[i])
      }
    })
  })
})
