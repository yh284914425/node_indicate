<template>
  <div class="daily-overview">
    <n-card title="当日市场概览">
      <n-spin :show="loading">
        <n-space vertical>
          <n-grid :cols="isMobile ? 1 : 4" :x-gap="12">
            <n-grid-item v-for="period in periods" :key="period.interval">
              <n-card :title="period.label" size="small" class="period-card">
                <n-space vertical>
                  <div class="divergence-count">
                    <div class="count-item top">
                      <div class="count-label">顶背离</div>
                      <div class="count-value">{{ period.topDivergences.length }}</div>
                    </div>
                    <div class="count-item bottom">
                      <div class="count-label">底背离</div>
                      <div class="count-value">{{ period.bottomDivergences.length }}</div>
                    </div>
                  </div>
                  <n-collapse>
                    <n-collapse-item 
                      :title="`详细信息 (${period.topDivergences.length + period.bottomDivergences.length})`"
                      :default-expanded="true"
                    >
                      <n-scrollbar style="max-height: 200px">
                        <template v-if="period.topDivergences.length > 0">
                          <div class="divergence-section">
                            <div class="section-title top">顶背离</div>
                            <n-list>
                              <n-list-item v-for="item in period.topDivergences" :key="`${item.symbol}-${item.time}`">
                                <n-space justify="space-between" align="center">
                                  <n-text strong style="color: #d03050">{{ item.symbol }}</n-text>
                                  <n-text>{{ item.price }}</n-text>
                                  <n-text depth="3">
                                    {{ new Date(item.time).toLocaleTimeString() }}
                                  </n-text>
                                </n-space>
                              </n-list-item>
                            </n-list>
                          </div>
                        </template>
                        <template v-if="period.bottomDivergences.length > 0">
                          <div class="divergence-section">
                            <div class="section-title bottom">底背离</div>
                            <n-list>
                              <n-list-item v-for="item in period.bottomDivergences" :key="`${item.symbol}-${item.time}`">
                                <n-space justify="space-between" align="center">
                                  <n-text strong style="color: #18a058">{{ item.symbol }}</n-text>
                                  <n-text>{{ item.price }}</n-text>
                                  <n-text depth="3">
                                    {{ new Date(item.time).toLocaleTimeString() }}
                                  </n-text>
                                </n-space>
                              </n-list-item>
                            </n-list>
                          </div>
                        </template>
                        <n-empty v-if="period.topDivergences.length + period.bottomDivergences.length === 0" description="暂无背离" />
                      </n-scrollbar>
                    </n-collapse-item>
                  </n-collapse>
                </n-space>
              </n-card>
            </n-grid-item>
          </n-grid>
        </n-space>
      </n-spin>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useMessage } from 'naive-ui'
import { MultiSymbolService } from '../services/multiSymbolService'

const multiSymbolService = new MultiSymbolService()
const message = useMessage()
const loading = ref(false)

interface PeriodData {
  label: string
  interval: string
  topDivergences: Array<{symbol: string, price: string, time: string}>
  bottomDivergences: Array<{symbol: string, price: string, time: string}>
}

const periods = ref<PeriodData[]>([
  { label: '15分钟', interval: '15m', topDivergences: [], bottomDivergences: [] },
  { label: '30分钟', interval: '30m', topDivergences: [], bottomDivergences: [] },
  { label: '1小时', interval: '1h', topDivergences: [], bottomDivergences: [] },
  { label: '2小时', interval: '2h', topDivergences: [], bottomDivergences: [] },
  { label: '4小时', interval: '4h', topDivergences: [], bottomDivergences: [] },
  { label: '日线', interval: '1d', topDivergences: [], bottomDivergences: [] }
])

async function fetchAllPeriods() {
  loading.value = true
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const promises = periods.value.map(async period => {
      const result = await multiSymbolService.getDivergenceStats(today, period.interval)
      period.topDivergences = result.topDivergences
      period.bottomDivergences = result.bottomDivergences
    })

    await Promise.all(promises)
    message.success('数据加载完成')
  } catch (error) {
    console.error('获取数据失败:', error)
    message.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchAllPeriods()
})

const isMobile = computed(() => window.innerWidth <= 768)
</script>

<style scoped>
.daily-overview {
  padding: 16px;
}

.period-card {
  transition: all 0.3s ease;
}

.period-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.divergence-count {
  display: flex;
  justify-content: space-around;
  padding: 16px 0;
  border-radius: 8px;
  background: #f9fafb;
  margin-bottom: 12px;
}

.count-item {
  text-align: center;
  padding: 8px 16px;
  border-radius: 6px;
  min-width: 80px;
}

.count-item.top {
  background: rgba(208, 48, 80, 0.1);
}

.count-item.bottom {
  background: rgba(24, 160, 88, 0.1);
}

.count-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.count-value {
  font-size: 24px;
  font-weight: 600;
}

.count-item.top .count-value {
  color: #d03050;
}

.count-item.bottom .count-value {
  color: #18a058;
}

.divergence-section {
  margin-bottom: 12px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
  margin-bottom: 8px;
}

.section-title.top {
  background: rgba(208, 48, 80, 0.1);
  color: #d03050;
}

.section-title.bottom {
  background: rgba(24, 160, 88, 0.1);
  color: #18a058;
}

:deep(.n-card) {
  margin-bottom: 0;
}

:deep(.n-collapse) {
  background-color: transparent;
}

:deep(.n-collapse-item__header) {
  font-weight: bold;
  padding: 8px;
  background-color: #f9fafb;
  border-radius: 4px;
}

:deep(.n-list-item) {
  padding: 8px 12px;
}

:deep(.n-card-header) {
  padding: 12px 18px;
}

:deep(.n-collapse-item__content-wrapper) {
  padding: 8px 0;
}

:deep(.n-card-header) {
  padding: 12px 18px;
}

@media (max-width: 768px) {
  .daily-overview {
    padding: 8px;
  }

  .period-card {
    margin-bottom: 12px;
  }

  .divergence-count {
    padding: 8px 0;
  }

  .count-item {
    padding: 4px 8px;
  }

  .count-value {
    font-size: 20px;
  }

  :deep(.n-card-header) {
    padding: 8px 12px;
  }

  :deep(.n-card__content) {
    padding: 12px;
  }
}
</style> 