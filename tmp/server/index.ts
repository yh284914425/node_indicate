import express from 'express';
import { MonitorService } from './services/monitorService';

const app = express();
const monitors = new Map<string, MonitorService>();

app.use(express.json());

// 启动监控
app.post('/api/monitor/start', async (req, res) => {
  const { symbols, chatId } = req.body;
  
  try {
    // 如果已经存在相同chatId的监控，先停止它
    if (monitors.has(chatId)) {
      monitors.get(chatId)?.stopMonitoring();
    }
    
    // 创建新的监控实例
    const monitor = new MonitorService(chatId);
    await monitor.startMonitoring(symbols);
    monitors.set(chatId, monitor);
    
    res.json({ success: true, message: '监控已启动' });
  } catch (error) {
    res.status(500).json({ success: false, message: '启动监控失败' });
  }
});

// 停止监控
app.post('/api/monitor/stop', (req, res) => {
  const { chatId } = req.body;
  
  if (monitors.has(chatId)) {
    monitors.get(chatId)?.stopMonitoring();
    monitors.delete(chatId);
    res.json({ success: true, message: '监控已停止' });
  } else {
    res.status(404).json({ success: false, message: '未找到对应的监控' });
  }
});

// 获取监控状态
app.get('/api/monitor/status/:chatId', (req, res) => {
  const { chatId } = req.params;
  
  if (monitors.has(chatId)) {
    res.json({ 
      success: true, 
      isMonitoring: true,
      symbols: monitors.get(chatId)?.getMonitoredSymbols()
    });
  } else {
    res.json({ 
      success: true, 
      isMonitoring: false 
    });
  }
});

app.listen(3000, () => {
  console.log('监控服务器运行在端口 3000');
}); 