import axios from 'axios';
import { io } from './index.js';
import shortId from 'short-id';

import Trade from './models/trade';
import Result from './models/result';

import config from './common/config';
import binanceIO from './socketData';
// const Promise = require('bluebird')

import {exponentialMovingAverage, macdCalculate, simpleMA, signalMACD} from './common/ema';

const baseUrl = config.baseEndPoint;
export const infelicity = 10800000;
const comission = 0.05

export function getSocketDataKline(pair, interval) {
    const ws = new binanceIO();
    return  ws.getKlineData(pair, interval);
};

export function getDepthData(pair, levels = 20) {
    const ws = new binanceIO();
    return ws.getDepthData(pair, levels);
};

export function newResult() {
    return Result.find({})
        .then(results => {
            if(results.length > 0) {
                let sum = 0;
                let result = {};
                for(let i = 0; i < results.length; i++) {
                    const session = results[i].session;
                    if(!result[session]) {
                        result[session] = [results[i].result]
                    } else {
                        result[session].push(results[i].result);
                    }
                };
                for(let key in result) {
                    sum += result[key].reduce((a, b) => a + b, 0) / result[key].length;
                };

                return +sum.toFixed(2);
            } else {
                return 0
            }

        })
};

export function getResult() {
    return Result.find({})
        .then(results => {
            let result = {
                'BTC': 0,
                'ETH': 0,
                'BNB': 0
            };
            for(let i = 0; i < results.length; i++) {
                if(results[i].pair.indexOf('BTC') !== -1) {
                    if(result['BTC'] === 0) {
                        result['BTC'] = +results[i].result;
                    } else {
                        result['BTC'] += +results[i].result;
                    };
                } else if(results[i].pair.indexOf('ETH') !== -1) {
                    if(result['ETH'] === 0) {
                        result['ETH'] = +results[i].result;
                    } else {
                        result['ETH'] += +results[i].result;
                    };
                } else if(results[i].pair.indexOf('BNB') !== -1) {
                    if(result['BNB'] === 0) {
                        result['BNB'] = +results[i].result;
                    } else {
                        result['BNB'] += +results[i].result;
                    };
                };
            };
            for(let key in result) {
                result[key] = +result[key].toFixed(2)
            };
            return result;
        })
};

export function analyzeData(interval='1h') {
    // Get pairs
    const limit = 50;
    const session = shortId.generate();
    return axios({
        url: baseUrl + '/api/v1/exchangeInfo',
        method: 'get'
    })
        .then(resp => {
            let i = 0;
            const prArr = resp.data.symbols
                .slice(0, 200)
                .map(item => {
                return getKline(item.symbol, interval)
                }
            );
            return Promise.all(prArr)
        })

        .then(data => {
                    console.log('ASDASDASASD')
                    // const priceData = data
                    //     .map(pair => {
                    //     return {
                    //         pair: pair.pair,
                    //         data: pair.data.map(data => {
                    //             return {
                    //                 time: new Date(data[0] + infelicity),
                    //                 price: +data[4],
                    //                 minPrice: +data[3]
                    //             }
                    //         })
                    //     }
                    // });
                    // data.forEach(item => console.log(item.data.length))
                    return data
                        .filter(item => isNaN(+item.pair))
                        .map(item => {
                            exponentialMovingAverage(item.data, 12);
                            exponentialMovingAverage(item.data, 26);
                            simpleMA(item.data, 7);
                            simpleMA(item.data, 25);
                            macdCalculate(item.data);
                            const macdData = signalMACD(item.data);
                            return {
                                pair: item.pair,
                                data: macdData
                            }
                        })
                        .filter(item => !!item.data);

                })
                .then(data => {
                    let result = [];
                    data.filter(order => order.pair.toLowerCase().indexOf('btc') !== -1).forEach(item => {
                        let fmacd = item.data[item.data.length - 4].macd;
                        let fsignal = item.data[item.data.length - 4].signal;
                        let pmacd = item.data[item.data.length - 3].macd;
                        let psignal = item.data[item.data.length - 3].signal;
                        let lmacd = item.data[item.data.length - 2].macd;
                        let lsignal = item.data[item.data.length - 2].signal;
                        let nowmacd = item.data[item.data.length - 1].macd;
                        let nowsignal = item.data[item.data.length - 1].signal;

                        // Min local price detection
                        // item.min = {
                        //     price: 100
                        // };
                        // for(let i = 0; i < item.data.length - 1; i++) {
                        //     const data = item.data[i];
                        //     if(data.minPrice < item.min.price) {
                        //         item.min = {
                        //             position: limit - 1 - i,
                        //             price: data.minPrice
                        //         };
                        //     };
                        // };
                        // ******************
                        const sevenAndTwentyFiveEmaDiff =
                            (item.data[item.data.length - 3]['ma-7'] - item.data[item.data.length - 3]['ma-25'])
                            < 0 &&
                            (item.data[item.data.length - 2]['ma-7'] - item.data[item.data.length - 2]['ma-25'])
                            >= 0 &&
                            (item.data[item.data.length - 1]['ma-7'] - item.data[item.data.length - 1]['ma-25'])
                            > 0;

                        const threeUppers =
                            (item.data[item.data.length - 3]['ma-7'] < item.data[item.data.length - 2]['ma-7'])
                            &&
                            (item.data[item.data.length - 2]['ma-7'] < item.data[item.data.length - 1]['ma-7']);

                        const threeDown =
                            (item.data[item.data.length - 3]['ma-7'] > item.data[item.data.length - 2]['ma-7'])
                            &&
                            (item.data[item.data.length - 2]['ma-7'] > item.data[item.data.length - 1]['ma-7']);

                        const threeUppersMACD = (fmacd < lmacd) && (pmacd < lmacd) && (lmacd < nowmacd);
                        const threeDownMACD = (fmacd > lmacd) && (pmacd > lmacd) && (lmacd > nowmacd);
                        const divergentMACD = (fmacd > pmacd) && (pmacd < lmacd) && (lmacd < nowmacd);

                        const ma7UnderMa25 =
                            (item.data[item.data.length - 3]['ma-7'] < item.data[item.data.length - 3]['ma-25']) &&
                            (item.data[item.data.length - 2]['ma-7'] < item.data[item.data.length - 2]['ma-25']) &&
                            (item.data[item.data.length - 1]['ma-7'] < item.data[item.data.length - 1]['ma-25']);

                        const pSignalMA7 =  item.data[item.data.length - 3]['ma-7'];
                        const lSignalMA7 =  item.data[item.data.length - 2]['ma-7'];

                        const pSignalDiff = item.data[item.data.length - 3]['ma-25'] - item.data[item.data.length - 3]['ma-7'];
                        const lSignalDiff = item.data[item.data.length - 2]['ma-25'] - item.data[item.data.length - 2]['ma-7'];
                        const nowSignalDiff = item.data[item.data.length - 1]['ma-25'] - item.data[item.data.length - 1]['ma-7'];

                        const nowdiff = nowmacd - nowsignal;
                        const ldiff = lmacd - lsignal;
                        const pdiff = pmacd - psignal;
                        const fdiff = fmacd - fsignal;

                        const signalCross = fdiff < 0 && ldiff <= 0 && pdiff > 0 && nowdiff > 0;
                        const signalWithMAS = ldiff > 0 && pdiff > 0 && nowdiff > 0;

                        const coming = (fmacd < pmacd && pmacd <= lmacd) && (pSignalMA7 <= lSignalMA7);
                        const down = (fmacd > pmacd && pmacd > lmacd) && (pSignalMA7 > lSignalMA7) &&
                                fmacd < 0 &&
                                pmacd < 0 &&
                                lmacd < 0 &&
                                nowmacd < 0;

                        if(true) {
                            result.push(item);
                        };
                    });

                    if(result.length > 0) {
                        return Promise.all(result.map(item => {
                            return new Trade({
                                pair: item.pair,
                                session,
                                // localMin: item.min,
                                startPrice: item.data[item.data.length - 1].price,
                                // buyPrice: item.data[item.data.length - 1].price,
                                // createdAt: Date.now() + infelicity,
                                startTime: Date.now() + infelicity,
                                currentPrice: item.data[item.data.length - 1].price,
                                interval
                            }).save();
                        }))
                            .then(trades => {
                                return { result }
                            })
                    } else {
                        return { result }
                    }
                })
        .catch(err => { throw err })
};

export function startBot(interval, res) {
    let pair;
    analyzeData(interval)
        .then(result => {
            result.result.forEach(item => {

                const ws = getSocketDataKline(item.pair, interval);
                ws.on('message', msg => {
                    const message = JSON.parse(msg);
                    const currentPrice = message.k.c;
                    const msgPair = message.s;
                    compareProfit(msgPair, currentPrice, ws);
                    io.emit(`kline-${item.pair}`, msg)
                });
                ws.on('error', err => console.log('ws: ', err))
            });
            // res.end();
        })
        .catch(err => {
            // io.emit(`error-on-${item.pair}`, err.responsse ? err.response.data.error.msg : err.message)
            console.log(err)
        })
};

export function calculatePercentProfit(currentPrice, buyPrice) {
    return +((+currentPrice - +buyPrice) / (+buyPrice / 100)).toFixed(2);
};
export function compareProfit(pair, currentPrice, ws) {
    Trade.findOne({ pair })
        .then(trade => {
            const nowHour = new Date().getHours();
            // console.log(nowHour, trade.createdAt.getHours())
            // if(trade && trade.createdAt.getHours() > nowHour + 2) {
            //     trade.closePrice = currentPrice;
            //     trade.save();
            // };
            if(trade && trade.buyPrice && !trade.closePrice &&
                (calculatePercentProfit(+currentPrice, trade.buyPrice) > 2.5 )) {
                // calculatePercentProfit(+currentPrice, trade.buyPrice) < -2)) {

                Promise.all([(() => {
                    const diff = (currentPrice - trade.buyPrice) / (trade.buyPrice / 100) - comission;
                    new Result({
                        pair,
                        buyDate: trade.createdAt,
                        result: diff
                    }).save()
                })(),
                    (() => {
                        trade.closePrice = +currentPrice;
                        trade.save()
                    })()
                ])
                    .then(() => {
                        newResult()
                            .then(result => {
                                ws.close()
                                io.emit(`close-kline-${trade.pair}`, currentPrice);
                                io.emit('set-result', result);
                            })

                    })
                    .catch(err => {
                        io.emit(`error-on-${trade.pair}`, err.response ? err.response.data.error.msg : err.message)
                    })
            };
        })
};

export function getKline(symbol, interval) {
    // let params = {
    //     symbol,
    //     interval,
    //     limit: 50
    // };
    return axios({
        method: 'get',
        params: {
            symbol,
            interval,
            limit: 50
        },
        url: baseUrl + '/api/v1/klines'
    })
        .then(resp => {
            return {
                pair: symbol,
                data: resp.data
                    .map(data => {
                        return {
                            time: new Date(data[0] + infelicity),
                            price: +data[4],
                            minPrice: +data[3]
                        }
                    })
            }
        })


};
