const fs = require("fs");
const CHANNEL_FILE_PATH = "channels.json";

const findOneByTokenId = (tokenList, tokenId) => {
  return tokenList.find(
    (token) => token.symbol.toUpperCase() === tokenId.toUpperCase()
  );
};

const isTokenId = (message) => {
  return message.startsWith(",");
};

// const getPercent = async (tokenId, currentSystemPrice) => {
//   try {
//     // Read the existing data from the file
//     let data = fs.readFileSync("log.json", "utf8");
//     const oldJson = JSON.parse(data);
//     const oldPrice =
//       oldJson.find(
//         (item) => item.symbol.toUpperCase() === tokenId.toUpperCase()
//       ).system_price ||
//       oldJson.find(
//         (item) => item.symbol.toUpperCase() === tokenId.toUpperCase()
//       ).systemPrice;
//     // Parse the existing JSON data
//     let ans = parseFloat(
//       (parseFloat(oldPrice) - currentSystemPrice) / currentSystemPrice
//     );
//     ans = parseFloat(ans * 100).toFixed(2);
//     console.log("ans", ans);
//     return ans * -1;
//   } catch (error) {
//     console.error(error);
//   }
// };

const formatNumber = (number) => {
  const formattedNumber = new Intl.NumberFormat("en-US", {
    style: "decimal",
    maximumFractionDigits: 2,
  }).format(number);
  return formattedNumber;
};

const checkChannelUsername = (username) => {
  try {
    // Read the existing data from the file
    let data = fs.readFileSync(CHANNEL_FILE_PATH, "utf8");
    const json = JSON.parse(data);

    let flag = 1;

    // Parse the existing JSON data
    if (json.activated.findIndex((channel) => channel == username) === -1) {
      flag = 0;
      if (json.pending.findIndex((channel) => channel == username) === -1) {
        flag = 2;
        json.pending.push(username);
        // Write the updated data back to the file
        fs.writeFileSync(CHANNEL_FILE_PATH, JSON.stringify(json, null, 2));
      }
    }
    return flag;
  } catch (error) {
    console.error(error);
  }
};

const getPendingChannels = () => {
  try {
    // Read the existing data from the file
    let data = fs.readFileSync(CHANNEL_FILE_PATH, "utf8");
    const json = JSON.parse(data);
    const ans = json.pending.reduce(
      (acc, item, index) => acc + (index + 1).toString() + ". " + item + "\n",
      ""
    );
    if (ans.trim().length) return ans;
    return "no pending channels";
  } catch (error) {
    console.error(error);
  }
};

const getActivatedChannels = () => {
  try {
    // Read the existing data from the file
    let data = fs.readFileSync(CHANNEL_FILE_PATH, "utf8");
    const json = JSON.parse(data);
    const ans = json.activated.reduce(
      (acc, item, index) => acc + (index + 1).toString() + ". " + item + "\n",
      ""
    );
    return ans;
  } catch (error) {
    console.error(error);
  }
};

const getDeactivatedChannels = () => {
  try {
    // Read the existing data from the file
    let data = fs.readFileSync(CHANNEL_FILE_PATH, "utf8");
    const json = JSON.parse(data);
    const ans = json.deactivated.reduce(
      (acc, item, index) => acc + (index + 1).toString() + ". " + item + "\n",
      ""
    );
    return ans;
  } catch (error) {
    console.error(error);
  }
};

const activate = (index) => {
  try {
    // Read the existing data from the file
    let data = fs.readFileSync(CHANNEL_FILE_PATH, "utf8");
    const json = JSON.parse(data);
    const username = json.pending[index];
    json.pending.splice(index, 1);
    json.activated.push(username);

    fs.writeFileSync(CHANNEL_FILE_PATH, JSON.stringify(json, null, 2));
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

const deactivate = (index) => {
  try {
    // Read the existing data from the file
    let data = fs.readFileSync(CHANNEL_FILE_PATH, "utf8");
    const json = JSON.parse(data);
    const username = json.activated[index];
    json.activated.splice(index, 1);
    json.deactivated.push(username);

    fs.writeFileSync(CHANNEL_FILE_PATH, JSON.stringify(json, null, 2));
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};
function formatToScientific(num) {
  // Convert the number to a string
  const numStr = num.toString();

  // Check if the number is in scientific notation already
  if (numStr.includes("e")) {
    return numStr;
  }

  // Count the number of zeros after the decimal point up to the first non-zero digit
  const decimalPart = numStr.split(".")[1] || ""; // Handle numbers without a decimal part
  const zerosMatch = decimalPart.match(/^0+/); // Match leading zeros
  const zeroCount = zerosMatch ? zerosMatch[0].length : 0;

  // Return original number if there are less than 5 zeros, otherwise convert to exponential notation
  if (zeroCount < 5) {
    return parseFloat(numStr).toFixed(6); // Return the original string representation
  } else {
    return num.toExponential(); // Convert to exponential notation
  }
}

const checkAdmin = (ctx) => {
  if (ctx.chat.username != "bitmage0823" && ctx.chat.username != "novaxpr") {
    ctx.reply("you are not allowed to send this command");
    return false;
  }
  return true;
};

module.exports = {
  findOneByTokenId,
  isTokenId,
  formatNumber,
  checkChannelUsername,
  getPendingChannels,
  activate,
  deactivate,
  getActivatedChannels,
  formatToScientific,
  checkAdmin,
  getDeactivatedChannels,
};
