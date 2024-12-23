import axios from 'axios';

export class TelegramService {
  private botToken: string;
  private chatId: string;

  constructor(botToken: string, chatId: string) {
    this.botToken = botToken;
    this.chatId = chatId;
  }

  async sendMessage(message: string) {
    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      await axios.post(url, {
        chat_id: this.chatId,
        text: message,
        parse_mode: 'HTML'
      });
      console.log('Telegram消息发送成功');
    } catch (error) {
      console.error('Telegram消息发送失败:', error);
      throw error;
    }
  }
} 