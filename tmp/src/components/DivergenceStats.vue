<template>
  <div class="divergence-stats">
    <n-space vertical>
      <n-card title="多币种背离统计">
        <n-spin :show="loading">
          <n-space vertical>
            <n-date-picker
              v-model:value="selectedDate"
              type="date"
              clearable
              :actions="['clear', 'now']"
              @update:value="onDateChange"
            />
            
            <n-select
              v-model:value="selectedInterval"
              :options="intervalOptions"
              placeholder="选择时间间隔"
              @update:value="onIntervalChange"
            />

            <n-space justify="space-between">
              <n-statistic label="顶背离数量">
                {{ topDivergences.length }}
              </n-statistic>
              <n-statistic label="底背离数量">
                {{ bottomDivergences.length }}
              </n-statistic>
              <n-statistic label="已分析币种">
                {{ processedSymbols }}/{{ totalSymbols }}
              </n-statistic>
            </n-space>

            <n-divider />

            <n-grid :x-gap="12" :cols="isMobile ? 1 : 2">
              <n-grid-item>
                <n-card title="顶背离" size="small">
                  <n-scrollbar style="max-height: 600px">
                    <n-list v-if="topDivergences.length > 0">
                      <n-list-item v-for="item in topDivergences" :key="item.symbol">
                        <n-space justify="space-between" align="center">
                          <n-text strong>{{ item.symbol }}</n-text>
                          <n-text>{{ item.price }}</n-text>
                          <n-text depth="3">
                            {{ new Date(item.time).toLocaleString() }}
                          </n-text>
                        </n-space>
                      </n-list-item>
                    </n-list>
                    <n-empty v-else description="暂无顶背离" />
                  </n-scrollbar>
                </n-card>
              </n-grid-item>

              <n-grid-item>
                <n-card title="底背离" size="small">
                  <n-scrollbar style="max-height: 600px">
                    <n-list v-if="bottomDivergences.length > 0">
                      <n-list-item v-for="item in bottomDivergences" :key="item.symbol">
                        <n-space justify="space-between" align="center">
                          <n-text strong>{{ item.symbol }}</n-text>
                          <n-text>{{ item.price }}</n-text>
                          <n-text depth="3">
                            {{ new Date(item.time).toLocaleString() }}
                          </n-text>
                        </n-space>
                      </n-list-item>
                    </n-list>
                    <n-empty v-else description="暂无底背离" />
                  </n-scrollbar>
                </n-card>
              </n-grid-item>
            </n-grid>
          </n-space>
        </n-spin>
      </n-card>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useMessage } from 'naive-ui'
import { MultiSymbolService } from '../services/multiSymbolService'

const message = useMessage()
const multiSymbolService = new MultiSymbolService()

const selectedDate = ref<number>(Date.now())
const selectedInterval = ref('1d')
const topDivergences = ref<Array<{symbol: string, price: string, time: string}>>([])
const bottomDivergences = ref<Array<{symbol: string, price: string, time: string}>>([])
const processedSymbols = ref(0)
const totalSymbols = ref(0)
const loading = ref(false)

const intervalOptions = [
  { label: '1分钟', value: '1m' },
  { label: '3分钟', value: '3m' },
  { label: '5分钟', value: '5m' },
  { label: '15分钟', value: '15m' },
  { label: '30分钟', value: '30m' },
  { label: '1小时', value: '1h' },
  { label: '2小时', value: '2h' },
  { label: '4小时', value: '4h' },
  { label: '6小时', value: '6h' },
  { label: '8小时', value: '8h' },
  { label: '12小时', value: '12h' },
  { label: '1天', value: '1d' },
  { label: '3天', value: '3d' },
  { label: '1周', value: '1w' },
  { label: '1月', value: '1M' }
]

async function onDateChange() {
  try {
    if (!selectedDate.value) {
      message.warning('请选择日期')
      return
    }
    loading.value = true
    
    // 根据选择的时间间隔调整日期处理
    const date = new Date(selectedDate.value)
    if (selectedInterval.value.includes('m')) {
      // 对于分钟级别，保持当前时间
      const now = new Date()
      date.setHours(now.getHours(), now.getMinutes(), 0, 0)
    } else {
      // 对于其他级别，设置为当天开始
      date.setHours(0, 0, 0, 0)
    }
    
    console.log('开始分析日期:', {
      date: date.toISOString(),
      interval: selectedInterval.value,
      timestamp: date.getTime()
    })
    
    const result = await multiSymbolService.getDivergenceStats(date, selectedInterval.value)
    
    // 添加调试信息
    if (result.debug) {
      console.log('BTC调试信息:', {
        分析时间: date.toISOString(),
        K线数量: result.debug.klines?.length,
        最后K线时间: result.debug.klineTimes?.[result.debug.klineTimes.length - 1],
        最后J值: result.debug.j?.[result.debug.j.length - 1],
        最后J1值: result.debug.j1?.[result.debug.j1.length - 1],
        顶背离: result.debug.topDivergence?.[result.debug.topDivergence.length - 1],
        底背离: result.debug.bottomDivergence?.[result.debug.bottomDivergence.length - 1]
      })
    }
    
    topDivergences.value = result.topDivergences
    bottomDivergences.value = result.bottomDivergences
    processedSymbols.value = result.processedSymbols
    totalSymbols.value = result.totalSymbols
  } catch (error) {
    console.error('获取背离统计失败:', error)
    message.error('获取背离统计失败: ' + (error instanceof Error ? error.message : String(error)))
  } finally {
    loading.value = false
  }
}

const onIntervalChange = () => {
  onDateChange()
}

onMounted(() => {
  // 设置初始日期为当天
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  selectedDate.value = today.getTime()
  onDateChange()
})

// 添加移动端检测
const isMobile = computed(() => window.innerWidth <= 768)
</script>

<style scoped>
.divergence-stats {
  padding: 20px;
  height: 100%;
  overflow: auto;
}

:deep(.n-card-header) {
  padding: 12px 18px;
}

:deep(.n-list-item) {
  padding: 8px 12px;
}

:deep(.n-card) {
  margin-bottom: 0;
}

@media (max-width: 768px) {
  .divergence-stats {
    padding: 8px;
  }

  :deep(.n-card-header) {
    padding: 8px 12px;
  }

  :deep(.n-card__content) {
    padding: 12px;
  }

  :deep(.n-list-item) {
    padding: 6px 8px;
  }

  :deep(.n-scrollbar) {
    max-height: 400px !important;
  }
}
</style>
