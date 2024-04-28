const Telegraf = require("telegraf");
const { Markup } = require("telegraf");
const Alcor = require("./api/Alcor");
const fs = require("fs");
const WizardScene = require("telegraf/scenes/wizard");

const dotenv = require("dotenv");

const {
  isTokenId,
  findOneByTokenId,
  getPercent,
  formatNumber,
  checkChannelUsername,
  getPendingChannels,
  activate,
  deactivate,
  getActivatedChannels,
  formatToScientific,
  checkAdmin,
  getPercent1,
} = require("./util/util");
const filePath = "log.json";

const adminId = "@novaxpr";

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);

// bot.on("my_chat_member", (ctx) => {
//   const chat = ctx.update.my_chat_member.chat;
//   const botInChat = ctx.update.my_chat_member.new_chat_member;
//   const botWasAdded = botInChat.status === "member";

//   if (botWasAdded) {
//     ctx.telegram.sendMessage(
//       chat.id,
//       "Hello! Thank you for adding me to your group!"
//     );
//   }
// });

let commands = [
  { command: "/start", description: "Start the bot" },
  // { command: "/pending", description: "Get the list of pending channels" },
  // {
  //   command: "/activatedchannels",
  //   description: "Get the list of activated channels",
  // },
  // {
  //   command: "/activate",
  //   description: "/activate {index from the pending channel list}",
  // },
  // {
  //   command: "/deactivate",
  //   description: "/deactivate {index from the activated channel list}",
  // },
];

// Set the bot commands
bot.telegram.setMyCommands(commands);

const authorize = (ctx) => {
  // if (ctx.chat.type !== "channel") {
  //   ctx.reply(`Welcome to the bot!\nThis bot is used only in channels.`, {
  //     parse_mode: "Markdown",
  //   });
  // }
  let username = ctx.chat.username;
  console.log("username", username);

  if (!username) username = ctx.chat.id;
  const ans = checkChannelUsername(username);
  if (ans === 1) {
    return true;
  } else if (ans === 2) {
    ctx.reply(
      `Welcome to the bot!\nPlease wait till this channel is approved by admin - [${adminId}](https://t.me/novaxpr)`,
      { parse_mode: "Markdown" }
    );
    return false;
  }
  return false;
};

// Handle the /start command
bot.command("start", (ctx) => {
  if (authorize(ctx)) ctx.reply("Feel free to send token ID you want to see");
});

bot.command("pending", (ctx) => {
  if (checkAdmin(ctx)) ctx.reply(getPendingChannels());
});

bot.command("activatedchannels", (ctx) => {
  if (checkAdmin(ctx)) ctx.reply(getActivatedChannels());
});

bot.command("deactivatedchannels", (ctx) => {
  if (checkAdmin(ctx)) ctx.reply(getActivatedChannels());
});

bot.command("activate", (ctx) => {
  if (!checkAdmin(ctx)) return;
  const submittedChannel = ctx.message.text.split(" ")[1];

  if (submittedChannel && parseInt(submittedChannel) > 0) {
    activate(parseInt(submittedChannel) - 1);
    ctx.reply("Activated!");
  } else {
    ctx.reply("Please provide the channel index.");
  }
});

bot.command("deactivate", (ctx) => {
  if (!checkAdmin(ctx)) return;
  const submittedChannel = ctx.message.text.split(" ")[1];

  if (submittedChannel && parseInt(submittedChannel) > 0) {
    deactivate(parseInt(submittedChannel) - 1);
  } else {
    ctx.reply("Please provide the channel index.");
  }
});

bot.command("cmd", (ctx) => {
  if (!checkAdmin(ctx)) return;

  ctx.replyWithMarkdown(`*List of admin available commands*`, {
    parse_mode: "Markdown",
    reply_markup: Markup.inlineKeyboard([
      Markup.callbackButton("Get Pending channels", "pending"),
      Markup.callbackButton("Get activated channels", "activated"),
    ]),
  });
});

bot.action("pending", (ctx) => {
  ctx.reply(getPendingChannels());
});

bot.action("activated", (ctx) => {
  ctx.reply(getActivatedChannels());
});

bot.on("text", async (ctx) => {
  text = ctx.message.text;
  switch (text) {
    case "hello":
      break;
    default:
      if (!authorize(ctx)) return;
      if (!isTokenId(ctx.message.text)) break;

      let tokenId = ctx.message.text.substring(1).toUpperCase();
      try {
        let tokenList = await Alcor.getTokens();
        let token = findOneByTokenId(tokenList, tokenId);

        if (!token) {
          ctx.reply(`The provided token ID does not exist!`);
          return;
        }

        const price = token.usd_price;
        const volume24 = await Alcor.get24hrVolume(tokenId);
        const volume24USD = price * volume24;
        const volumeMonth = await Alcor.getMonthlyVolume(tokenId);
        const volumeMonthUSD = price * volumeMonth;
        const volumeWeek = await Alcor.getWeeklyVolume(tokenId);
        const volumeWeekUSD = price * volumeWeek;

        const cirSupply = await Alcor.getCirculatingSupply(
          tokenId,
          token.contract
        );
        const marketCap = parseFloat(cirSupply) * price;
        const percent = await getPercent(
          tokenId,
          parseFloat(
            parseFloat(token.system_price) ||
              (token.systemPrice && parseFloat(token.systemPrice))
          )
        );
        // const poolId = await Alcor.getPoolId(tokenId);
        ctx.replyWithMarkdown(
          `[$${tokenId}](#) token Price:\n${formatToScientific(price)} USD (${
            percent || " "
          }%${percent < 0 ? "🔻" : "✅"})\n${
            token.system_price
              ? token.system_price.toFixed(6)
              : token.systemPrice.toFixed(6)
          } XPR\n\n` +
            `*Daily volume:*\n` +
            `📉*Volume in ${tokenId}:* ${formatNumber(volume24)}\n` +
            `📈*Volume in USD:* $${formatNumber(volume24USD)}\n\n` +
            `*Weekly volume:*\n` +
            `📉*Volume in ${tokenId}:* ${formatNumber(volumeWeek)}\n` +
            `📈*Volume in USD:* $${formatNumber(volumeWeekUSD)}\n\n` +
            `*Monthly volume:*\n` +
            `📉*Volume in ${tokenId}:* ${formatNumber(volumeMonth)}\n` +
            `📈*Volume in USD:* $${formatNumber(volumeMonthUSD)}\n\n` +
            `*MarketCap:* $${formatNumber(marketCap)} | ` +
            `*Circulating Supply:* ${formatNumber(parseFloat(cirSupply))}\n` +
            `Provided by [${adminId}](https://t.me/novaxpr)`,
          {
            parse_mode: "Markdown",
            reply_markup: Markup.inlineKeyboard([
              Markup.urlButton(
                "Swap",
                `https://proton.alcor.exchange/swap?input=XPR-eosio.token&output=${tokenId}-${token.contract}`
              ),
              Markup.urlButton(
                "Trade",
                `https://proton.alcor.exchange/trade/${token.id}_xpr-eosio.token`
              ),
              Markup.urlButton(
                "Pools",
                `https://proton.alcor.exchange/analytics/tokens/${token.id}`
              ),
              Markup.urlButton(
                "Staking",
                `https://blastpad.io/available-staking-pools`
              ),
            ]),
          }
        );
      } catch (err) {
        console.error(err);
        ctx.reply(`Something went wrong!`);
      }
      break;
  }
});

bot.launch();

setInterval(async function () {
  // Get current UTC time
  var currentDate = new Date();
  var currentUTCHours = currentDate.getUTCHours();
  var currentUTCMinutes = currentDate.getUTCMinutes();

  // Check if current UTC time is 00:00
  if (currentUTCHours === 0) {
    // Call your API here
    const tokenList = await Alcor.getTokens();

    // Write the updated data back to the file
    fs.writeFile(filePath, JSON.stringify(tokenList, null, 2), (err) => {
      if (err) {
        console.error("Error writing file:", err);
      } else {
        console.log("File successfully updated!");
      }
    });
    // Replace the console.log with your API call
  }
}, 1000 * 60 * 60); // Check every minute (60000 milliseconds)
