#!/usr/bin/env node

const version = require("./package.json").version;
const config = require("./config.json");

const chalk = require("chalk");
const { spawn } = require("child_process");

const { calculateReward, sendNotification } = require("./helpers");
const { getCryptoPrice } = require("crypto-price");

console.log(chalk.blue("Staring Node Miner", version));
console.log(chalk.blue(`Found ${config.coins.length} coins`));

let miner = null;
let currentCoin = config.coins[0];

const runMiner = (cmd) =>
  new Promise((resolve, reject) => {
    const command = cmd.split(" ");
    miner = spawn(command[0], command.slice(1, command.length));

    miner.stdout.on("data", (data) => {
      console.log(`stdout: ${data}`);
    });

    miner.stderr.on("data", (data) => {
      console.log(`stderr: ${data}`);
    });

    miner.on("error", (error) => {
      console.log(`error: ${error.message}`);
      reject(error);
    });

    miner.on("close", (code) => {
      console.log(`child process exited with code ${code}`);
      resolve();
    });
  });

const killMiner = () => {
  if (miner) {
    console.log(chalk.redBright("Ending miner for", currentCoin.symbol));
    miner.kill();
  }
};

const start = async (coin) => {
  currentCoin = coin;
  console.log(chalk.greenBright("Starting miner for", coin.symbol));
  await runMiner(coin.cmd);
};

const checkProfit = async () => {
  let coin;

  let bestPrice = 0;
  let bestCoin = currentCoin;
  for (let i = 0; i < config.coins.length; i++) {
    coin = config.coins[i];
    console.log(chalk.whiteBright("Checking profit for", coin.symbol));

    const reward = await calculateReward(coin.symbol, coin.algo, 21);
    // console.log("reward", reward.per_day);
    const currentPrice = await getCryptoPrice("USD", coin.symbol);
    // console.log("price", currentPrice.price);
    const earningPerDay = reward.per_day * Number(currentPrice.price);
    console.log("Current earning / day", coin.symbol, earningPerDay);
    if (earningPerDay > bestPrice) {
      bestPrice = earningPerDay;
      bestCoin = coin;
    }
  }

  console.log("Winner", bestCoin.symbol);

  if (currentCoin.symbol !== bestCoin.symbol) {
    await killMiner();
    start(bestCoin);

    await sendNotification(
      "FYI: Switching miner",
      bestCoin.symbol + " is more profitable"
    );
  }
};

start(config.coins[0]);

setInterval(() => {
  checkProfit();
}, 5 * 60000);
