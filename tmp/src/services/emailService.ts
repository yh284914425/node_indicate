import axios from 'axios';

export class EmailService {
  private apiUrl = 'YOUR_EMAIL_API_ENDPOINT'; // 需要替换为实际的邮件服务API

  async sendAlert(subject: string, content: string, to: string) {
    try {
      await axios.post(this.apiUrl, {
        to,
        subject,
        content
      });
      console.log('邮件发送成功');
    } catch (error) {
      console.error('邮件发送失败:', error);
      throw error;
    }
  }
} 