<script setup lang="ts">
import { NConfigProvider, NMessageProvider, NLayout, NLayoutHeader, NLayoutContent, NTabs, NTabPane } from 'naive-ui'
import CryptoDivergence from './components/CryptoDivergence.vue'
import DivergenceStats from './components/DivergenceStats.vue'
import DailyOverview from './components/DailyOverview.vue'
</script>

<template>
  <n-config-provider>
    <n-message-provider>
      <n-layout class="layout">
        <n-layout-header class="header">
          <div class="header-content">
            <h1>加密货币背离检测</h1>
          </div>
        </n-layout-header>
        <n-layout-content class="content">
          <n-tabs type="line" animated class="custom-tabs">
            <n-tab-pane name="single" tab="单币种分析">
              <CryptoDivergence />
            </n-tab-pane>
            <n-tab-pane name="stats" tab="多币种统计">
              <DivergenceStats />
            </n-tab-pane>
            <n-tab-pane name="daily" tab="当日概览">
              <DailyOverview />
            </n-tab-pane>

          </n-tabs>
        </n-layout-content>
      </n-layout>
    </n-message-provider>
  </n-config-provider>
</template>

<style>
.layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  height: 56px !important; /* 固定头部高度 */
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-content {
  background: linear-gradient(135deg, #18a058 0%, #0c7a43 100%);
  color: white;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-content h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.content {
  flex: 1;
  padding: 16px;
  overflow: auto;
  background-color: #f5f7fa;
}

.custom-tabs {
  background: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  min-height: calc(100vh - 120px);
}

:root {
  --primary-color: #18a058;
  --primary-hover: #0c7a43;
  --background-color: #f5f7fa;
  --card-background: #ffffff;
  --text-color: #333333;
  --border-color: #eaeaea;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 确保表格容器不会超出边界 */
.n-data-table-wrapper {
  max-width: none !important;
}

/* 调整卡片内边距 */
.n-card-content {
  padding: 16px !important;
}

/* 调整标签页内容区域 */
.n-tab-pane {
  min-height: calc(100vh - 180px);
}

/* 移除不必要的滚动条 */
.n-layout-scroll-container {
  overflow: hidden !important;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .header-content h1 {
    font-size: 1.2rem;
  }

  .content {
    padding: 8px;
  }

  .custom-tabs {
    padding: 8px;
    min-height: calc(100vh - 90px);
  }

  .n-tab-pane {
    min-height: calc(100vh - 140px);
    overflow: auto;
  }

  /* 确保内容可以滚动 */
  .n-layout-scroll-container {
    overflow: auto !important;
  }
}
</style>
