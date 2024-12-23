const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

class TelegramService {
    constructor() {
        this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {polling: false});
        this.chatId = process.env.TELEGRAM_CHAT_ID;
    }

    async sendMessage(message) {
        try {
            await this.bot.sendMessage(this.chatId, message);
        } catch (error) {
            console.error('发送电报消息失败:', error);
        }
    }
}

module.exports = new TelegramService(); 