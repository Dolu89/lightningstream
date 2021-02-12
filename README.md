# Lightningstream - Non custodial Bitcoin donation platform (on chain & LN) for streamers 

⚠️ **Lightningstream is still in development**

Lightningstream is a non-custodial Bitcoin donation platform focusing on donations for streamers, podcast hosts and other live or recorded content creators.

* Self-host your donation portal
* Direct, peer-to-peer Bitcoin donations
* Bitcoin on-chain and Lightning enabled
* Create and customize your donation alerts
* Link your [BTCPayServer](www.btcpayserver.org) instance to Lightningstream
* API support for automatic wallet configuration


---

## Installation

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
