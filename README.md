# Lightningstream - Non custodial Bitcoin donation platform (on chain & LN) for streamers 

⚠️ Lightningstream is still in development

---

## How to install

0. Prerequisite
- Node.js >= 12.0.0
- Posgresql >= 12 (< 12 not tested)
- [BTCPay server instance](https://github.com/btcpayserver/btcpayserver)

1. Clone & install
``` bash
git clone https://github.com/Dolu89/lightningstream.git
cd lightningstream
yarn install
node ace generate:key
```
2. Duplicate `.env.example` file to `.env`
3. DB migration
```
node ace migration:run
```
4. Launch
``` bash
yarn dev
```
5. Profit!

[http://localhost:3333/](http://localhost:3333/)
