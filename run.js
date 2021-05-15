#!/usr/bin/env node

const version = require("./package.json").version;
const config = require("./config.json");

const chalk = require("chalk");
const { spawn } = require("child_process");

const { calculateReward, sendNotification } = require("./helpers");
const { getCryptoPrice } = require("crypto-price");

console.log(chalk.blue.bold("Staring Node Miner", version));
console.log(chalk.blue.bold(`Found ${config.coins.length} coins`));

let miner, currentCoin;

const runMiner = (cmd) =>
  new Promise((resolve, reject) => {
    const command = cmd.split(" ");
    miner = spawn(command[0], command.slice(1, command.length));

    miner.stdout.on("data", (data) => {
      console.log(`Miner stdout: ${data}`);
    });

    miner.stderr.on("data", (data) => {
      console.log(`Miner stderr: ${data}`);
    });

    miner.on("error", async (error) => {
      console.log(`Miner error: ${error.message}`);
      await sendNotification("Miner has errored", error.message);
      reject(error);
    });

    miner.on("close", (code) => {
      console.log(`Miner child process exited with code ${code}`);
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

    const reward = await calculateReward(
      coin.symbol,
      coin.algo,
      config.avgHashRateMh
    );
    const currentPrice = await getCryptoPrice(config.baseCurrency, coin.symbol);

    const earningPerDay = reward.per_day * Number(currentPrice.price);
    console.log(
      chalk.whiteBright(
        `$/day [${config.baseCurrency}] -> `,
        coin.symbol,
        earningPerDay
      )
    );

    if (earningPerDay > bestPrice) {
      bestPrice = earningPerDay;
      bestCoin = coin;
    }
  }

  // Stop mining if profit is less than threshold
  if (bestPrice < config.minProfitThreshold) {
    console.log(chalk.white.bold("Suspending miner"));
    await killMiner();
  } else {
    if (currentCoin.symbol !== bestCoin.symbol) {
      console.log(
        chalk.BackgroundColor.whiteBright.greenBright.bold(
          "We've a new winner",
          bestCoin.symbol
        )
      );
      await killMiner();
      start(bestCoin);

      await sendNotification(
        "Switching Coin",
        bestCoin.symbol + " is more profitable"
      );
    } else {
      console.log(chalk.white.bold("Continue mining", currentCoin.symbol));
    }
  }
};

// Start
start(config.coins[0]);

// Poll
setInterval(() => {
  checkProfit();
}, config.profitCheckInterval * 60000);

process.on("uncaughtException", async (err) => {
  await sendNotification("Process has crashed", err.message);
  console.error("There was an uncaught error", err);
  process.exit(1); //mandatory (as per the Node docs)
});
