const axios = require("axios");

const BASE_URL = "https://proton.alcor.exchange/api/v2/";
const SUPPLY_URL = "https://proton-api.alcor.exchange/v1/chain/get_table_rows";

const getTokens = async () => {
  try {
    const response = await axios({
      method: "GET",
      url: `${BASE_URL}/tokens`,
      headers: {},
      params: {},
    });

    return response.data;
  } catch (error) {
    console.error(error);
  }
};

const getTokenInfo = async (tokenId) => {
  try {
    const response = await axios({
      method: "GET",
      url: `${BASE_URL}/tokens/${tokenId}`,
      headers: {},
      params: {},
    });

    return response.data;
  } catch (error) {
    console.error(error);
  }
};

const get24hrVolume = async (tokenId) => {
  console.log("tokenId", tokenId);
  let pools = await getPools();
  let totalSum = pools
    .filter((item) => item.tokenA.symbol === tokenId)
    .reduce((sum, item) => sum + item.volumeA24, 0);
  totalSum += pools
    .filter((item) => item.tokenB.symbol === tokenId)
    .reduce((sum, item) => sum + item.volumeB24, 0);

  return totalSum;
};

const get24hrVolumeUSD = async (tokenId) => {
  let totalCount = await get24hrVolume(tokenId);
  //Getting current price of the token in usd
  let tokenInfo = await getTokenInfo(tokenId);

  let volume = parseFloat(totalCount) * parseFloat(tokenInfo.usd_price);

  return volume;
};

const getMonthlyVolume = async (tokenId) => {
  let pools = await getPools();
  let totalSum = pools
    .filter((item) => item.tokenA.symbol === tokenId)
    .reduce((sum, item) => sum + item.volumeAMonth, 0);
  totalSum += pools
    .filter((item) => item.tokenB.symbol === tokenId)
    .reduce((sum, item) => sum + item.volumeBMonth, 0);

  return totalSum;
};

const getMonthlyVolumeUSD = async (tokenId) => {
  let totalCount = await getMonthlyVolume(tokenId);
  //Getting current price of the token in usd
  let tokenInfo = await getTokenInfo(tokenId);

  let volume = parseFloat(totalCount) * parseFloat(tokenInfo.usd_price);

  return volume;
};

const getWeeklyVolume = async (tokenId) => {
  let pools = await getPools();
  let totalSum = pools
    .filter((item) => item.tokenA.symbol === tokenId)
    .reduce((sum, item) => sum + item.volumeAWeek, 0);
  totalSum += pools
    .filter((item) => item.tokenB.symbol === tokenId)
    .reduce((sum, item) => sum + item.volumeBWeek, 0);

  return totalSum;
};

const getWeeklyVolumeUSD = async (tokenId) => {
  let totalCount = await getWeeklyVolume(tokenId);
  //Getting current price of the token in usd
  let tokenInfo = await getTokenInfo(tokenId);

  let volume = parseFloat(totalCount) * parseFloat(tokenInfo.usd_price);

  return volume;
};

const getPools = async () => {
  try {
    const response = await axios({
      method: "GET",
      url: `${BASE_URL}/swap/pools`,
    });

    return response.data;
  } catch (error) {
    console.error(error);
  }
};

const getCirculatingSupply = async (tokenId, contract) => {
  try {
    const response = await axios.post(SUPPLY_URL, {
      json: true,
      code: contract,
      scope: tokenId,
      table: "stat",
      table_key: "",
      lower_bound: "",
      upper_bound: "",
      index_position: 1,
      key_type: "",
      limit: 1,
      reverse: false,
      show_payer: false,
    });

    const supplyData = response.data;
    supply = supplyData.rows[0].supply;

    return supply;
  } catch (error) {
    console.error(error);
  }
};

const getMarketCap = async (tokenId) => {
  let supply = await getCirculatingSupply(tokenId);
  let { usd_price } = await getTokenInfo(tokenId);

  let marketCap = parseFloat(usd_price) * parseFloat(supply);

  return marketCap;
};

const getPercentforEachPool = async (poolId, max) => {
  var now = Date.now();
  // now = now - (now % 1000);
  // Get timestamp of two days ago
  var twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  twoDaysAgo.setFullYear(twoDaysAgo.getFullYear() - 1);
  twoDaysAgo = twoDaysAgo.getTime();

  // twoDaysAgo = twoDaysAgo - (twoDaysAgo % 1000);

  try {
    const response = await axios({
      method: "GET",
      url: `${BASE_URL}/swap/pools/${poolId.id}/candles`,
      params: {
        resolution: "1D",
        from: twoDaysAgo,
        to: now,
        reverse: false,
      },
    });

    candles = response.data;
    candle1 = candles[candles.length - 2];
    candle2 = candles[candles.length - 1];

    const percent =
      ((parseFloat(candle2.close) - parseFloat(candle1.close)) /
        parseFloat(candle1.close)) *
      100.0;

    if (Math.abs(percent) > Math.abs(max)) {
      max = percent;
    }
    return max;
  } catch (error) {
    console.error(error);
  }
};

const getPoolIds = async (tokenId) => {
  const pools = await getPools();
  const poolIds = pools.filter(
    (item) =>
      (item.tokenA.symbol === "XPR" && item.tokenB.symbol === tokenId) ||
      (item.tokenA.symbol === tokenId && item.tokenB.symbol === "XPR")
  );

  // return index >= 0 ? pools[index].id : -1;
  return poolIds;
};

const getPercent = async (tokenId) => {
  const poolIds = await getPoolIds(tokenId);

  let max = 0;

  for (var i = 0; i < poolIds.length; i++) {
    max = await getPercentforEachPool(poolIds[i], max);
  }

  return max.toFixed(2);
};

module.exports = {
  getTokens,
  get24hrVolume,
  getTokenInfo,
  get24hrVolumeUSD,
  getCirculatingSupply,
  getMarketCap,
  getMonthlyVolumeUSD,
  getMonthlyVolume,
  getWeeklyVolume,
  getWeeklyVolumeUSD,
  getPoolIds,
  getPercent,
};
