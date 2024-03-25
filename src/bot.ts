import TelegramBot from "node-telegram-bot-api";

import * as dotenv from "dotenv";

const token = "6669164005:AAGyRnIe47U147RHMgrxKn33DaRPfkQJYPM";

const bot = new TelegramBot(token, { polling: true });

dotenv.config();

export default bot;
