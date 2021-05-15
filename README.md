# Node Miner
Mining helper for profit switching

## Configuration

| Options  | Description |
| ------------- | ------------- |
| `coins`  | Array of coins, an object with symbol, algorithm and command to start mining |
| `avgHashRateMh`  | Average hash rate in Mh/s  |
| `baseCurrency`  | Base currency symbol, used for fetching crypto prices  |
| `profitCheckInterval`  | Polling interval in minutes to check profit |
| `minProfitThreshold`  | Minimum profit per day in base currency to start / stop mining |

## Start

```bash
npm install
node run.js

```
or using (PM2)
```bash
npm install
pm2 start run.js

```
