<!-- CryptoDivergence.vue -->
<template>
  <div class="crypto-divergence">
    <n-card class="settings-card">
      <template #header>
        <div class="card-header">
          <h3>单币种分析</h3>
        </div>
      </template>
      <div class="settings">
        <div class="select-group">
          <n-select
            v-model:value="selectedSymbol"
            :options="symbolOptions"
            placeholder="选择交易对"
            class="select-width"
            filterable
            :loading="loading"
            @update:value="fetchData"
          />
          <n-select
            v-model:value="selectedInterval"
            :options="intervalOptions"
            placeholder="选择时间间隔"
            class="select-width"
            @update:value="fetchData"
          />
        </div>
      </div>
    </n-card>

    <n-card v-if="signals.length > 0" class="signals-card">
      <template #header>
        <div class="card-header">
          <h3>背离信号</h3>
          <span class="signal-count">共 {{ signals.length }} 个信号</span>
        </div>
      </template>
      <n-data-table
        :columns="columns"
        :data="signals"
        :bordered="false"
        :single-line="false"
        :loading="loading"
        class="signal-table"
        size="large"
        :pagination="false"
        :max-height="600"
      />
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { 
  useMessage,
  NCard,
  NSelect,
  NButton,
  NDataTable
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import type { KlineData } from '../services/cryptoService'
import { CryptoService } from '../services/cryptoService'
import { MultiSymbolService } from '../services/multiSymbolService'

const message = useMessage()
const cryptoService = new CryptoService()
const multiSymbolService = new MultiSymbolService()

const selectedSymbol = ref('BTCUSDT')
const selectedInterval = ref('1h')
const signals = ref<any[]>([])
const loading = ref(false)

// 修改为动态获取的交易对列表
const symbolOptions = ref<Array<{ label: string, value: string }>>([])

// 获取所有交易对
const initSymbols = async () => {
  try {
    loading.value = true
    const symbols = await multiSymbolService.getAllSymbols()
    symbolOptions.value = symbols.map(symbol => ({
      label: symbol,
      value: symbol
    }))
  } catch (error) {
    console.error('获取交易对列表失败:', error)
    message.error('获取交易对列表失败')
  } finally {
    loading.value = false
  }
}

const intervalOptions = [
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

const columns: DataTableColumns = [
  {
    title: '时间',
    key: 'time'
  },
  {
    title: '类型',
    key: 'type',
    render(row: any) {
      return h(
        'div',
        {
          style: {
            color: row.type === '顶背离' ? '#d03050' : '#18a058',
            fontWeight: 'bold'
          }
        },
        row.type
      )
    }
  },
  {
    title: '价格',
    key: 'price',
    render(row: any) {
      return h(
        'div',
        {
          style: {
            color: row.type === '顶背离' ? '#d03050' : '#18a058',
            fontWeight: 'bold'
          }
        },
        row.price
      )
    }
  },
  {
    title: 'J值',
    key: 'j',
    render(row: any) {
      return h(
        'div',
        {
          style: {
            color: row.type === '顶背离' ? '#d03050' : '#18a058'
          }
        },
        row.j
      )
    }
  }
]

const fetchData = async () => {
  if (!selectedSymbol.value || !selectedInterval.value) {
    return;
  }
  
  try {
    loading.value = true;
    const klines = await cryptoService.getKlines(
      selectedSymbol.value,
      selectedInterval.value,
      1000
    );
    
    const { topDivergence, bottomDivergence, j } = cryptoService.calculateIndicators(klines);

    const newSignals = [];
    for (let i = 0; i < klines.length; i++) {
      if (topDivergence[i] || bottomDivergence[i]) {
        newSignals.push({
          time: new Date(klines[i].openTime).toLocaleString(),
          type: topDivergence[i] ? '顶背离' : '底背离',
          price: parseFloat(klines[i].close).toFixed(2),
          j: j[i].toFixed(2)
        });
      }
    }

    signals.value = newSignals.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    
    if (newSignals.length === 0) {
      message.info('当前时间范围内未发现背离信号');
    } else {
      message.success(`发现 ${newSignals.length} 个背离信号`);
    }
  } catch (error) {
    console.error('Error:', error);
    message.error(error instanceof Error ? error.message : '获取数据失败');
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await initSymbols(); // 先获取所有交易对
  fetchData();
});
</script>

<style scoped>
.crypto-divergence {
  padding: 16px;
  height: 100%;
}

.settings-card {
  margin-bottom: 16px;
  background-color: var(--card-background);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
}

.card-header h3 {
  margin: 0;
  font-size: 20px;
  color: var(--text-color);
  font-weight: 600;
}

.signal-count {
  color: #666;
  font-size: 14px;
  background: #f3f4f6;
  padding: 4px 12px;
  border-radius: 16px;
}

.settings {
  padding: 20px 0;
}

.select-group {
  display: flex;
  gap: 20px;
  align-items: center;
  flex-wrap: wrap;
}

.select-width {
  width: 240px;
}

.fetch-button {
  min-width: 120px;
  height: 34px;
}

.signals-card {
  background-color: var(--card-background);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  height: calc(100% - 140px);
  overflow: auto;
}

.signal-table {
  height: 100%;
}

:deep(.n-data-table .n-data-table-td) {
  padding: 16px;
}

:deep(.n-data-table .n-data-table-th) {
  padding: 16px;
  background-color: #f9fafb;
  font-weight: 600;
  font-size: 14px;
}

:deep(.n-card-header) {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

:deep(.n-card__content) {
  padding: 24px;
}

:deep(.n-button) {
  font-weight: 500;
}

:deep(.n-select) {
  .n-base-selection {
    border-radius: 8px;
  }
}

:deep(.n-data-table) {
  max-height: none !important;
}

@media (max-width: 768px) {
  .crypto-divergence {
    padding: 8px;
    height: calc(100vh - 140px);
    overflow: auto;
  }

  .settings-card {
    margin-bottom: 12px;
  }

  .select-width {
    width: 100%;
  }

  .select-group {
    flex-direction: column;
    gap: 12px;
  }

  .signals-card {
    height: calc(100% - 180px);
  }

  :deep(.n-data-table-wrapper) {
    overflow: auto;
  }

  :deep(.n-card-header) {
    padding: 12px 16px;
  }

  :deep(.n-card__content) {
    padding: 12px;
  }
}
</style>
