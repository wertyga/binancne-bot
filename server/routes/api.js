import express from 'express';
import axios from 'axios';
import config from '../common/config';
import shortId from 'short-id';

import { ee, io } from '../index';

import Trade from '../models/trade';
import Result from '../models/result';

import { analyzeData, newResult, startBot, getSocketDataKline, getDepthData, getKline } from '../getData';
import { publish } from '../rabbitMq';
import { infelicity } from '../getData';

let route = express.Router();
const baseUrl = config.baseEndPoint;
let start = 0;

// io.on('connection', socket => {
//     console.log('connect socket')
// });

route.get('/fetch-pair/:pair/:time/:limit/', (req, res) => {
    const { pair, time, limit } = req.params;

    if(!pair || pair === 'undefined') {
        res.status(400).json({ error: 'choose pair' });
        return;
    };
    const addedApiUrl = '/api/v1/klines';
    let params = {
        symbol: pair,
        interval: (!time || time === 'undefined' ) ? '1h' : time,
        // endTime: Date.now()
    };
    if(limit && limit !== 'undefined') params.limit = limit;
    axios({
        method: 'get',
        params,
        url: baseUrl + addedApiUrl
    })
        .then(resp => {
            const result = resp.data.map(data => {
                return {
                    'Open time': new Date(data[0] + infelicity),
                    Open: +data[1],
                    High: +data[2],
                    Low: +data[3],
                    Close: +data[4],
                    Volume: +data[5],
                    'Close time': new Date(data[6] + infelicity
                    ),
                    'Quote asset volume': +data[7],
                    'Number of trades': +data[8],
                    'Taker buy base asset volume': +data[9],
                    'Taker buy quote asset volume': +data[10],
                    Ignore: +data[11]
                };
            });
            res.json({ data: result });
        })
        .catch(err => {
            res.status(500).json({ error: err.response ? err.response.data.error.msg : err.message })
        })
});

route.get('/fetch-exist-pair/:pair/:time/:_id', (req, res) => {
    const {_id, pair, time} = req.params;

    const addedApiUrl = '/api/v1/klines';
    let params = {
        symbol: pair,
        interval: (!time || time === 'undefined' ) ? '1h' : time,
        limit: 50
        // endTime: Date.now()
    };
    axios({
        method: 'get',
        params,
        url: baseUrl + addedApiUrl
    })
        .then(resp => {
            const result = resp.data.map(data => {
                return {
                    'Open time': new Date(data[0] + infelicity),
                    Open: +data[1],
                    High: +data[2],
                    Low: +data[3],
                    Close: +data[4],
                    Volume: +data[5],
                    'Close time': new Date(data[6] + infelicity
                    ),
                    'Quote asset volume': +data[7],
                    'Number of trades': +data[8],
                    'Taker buy base asset volume': +data[9],
                    'Taker buy quote asset volume': +data[10],
                    Ignore: +data[11]
                };
            });
            Trade.findById(_id)
                .then(pair => {
                    res.json({
                        pair: {
                            ...pair,
                            currentPrice:  result[result.length - 1]['Close']
                        },
                        data: result
                    })
                })
        })
        .catch(err => res.status(500).json({ error: err.message }))
});

route.get('/get-pairs', (req, res) => {
    const addedApiUrl = '/api/v1/exchangeInfo';
    axios({
        method: 'get',
        url: baseUrl + addedApiUrl
    })
        .then(resp => {
            const symbols = resp.data.symbols.map(item => item.symbol);
            res.json({ symbols })
        })
        .catch(err => res.status(500).json({ error: err.response ? err.response.data.error.msg : err.message }))
});

route.get('/fetch-socket-data/:pair/:interval', (req, res) => {
    const depthLevels = 20;
    const {pair, interval} = req.params;
    const ws = getSocketDataKline(pair, interval);
    const depthWs = getDepthData(pair, depthLevels);
    ws.on('message', msg => {
        // const currentPrice = +JSON.parse(msg).k.c;
        // compareProfit(pair, currentPrice)
        io.emit(`kline-${pair}`, msg)
    });
    ws.on('error', err => {
        console.log(err)
    });
    
    ws.on('close', () => { console.log('Close socket') })
    // depthWs.on('message', msg => {
    //     io.emit(`depth-${pair}`, JSON.parse(msg));
    // });
    res.end();
});

route.post('/comment', (req, res) => {
    const { comment, id } = req.body;

    Trade.findByIdAndUpdate(id, { $set: { comment } })
        .then(() => res.json('comment edited'))
        .catch(err => res.status(500).json({ error: err.message }))
});

route.get('/get-bot/:interval', (req, res) => {
    const interval  = req.params.interval;
    analyzeData(interval)
        .then(result => {
        //     // result.result.forEach(item => {
        //     //     const ws = getSocketDataKline(item.pair, interval);
        //     //     ws.on('message', msg => {
        //     //         io.emit(`kline-${item.pair}`, msg)
        //     //     });
        //     // });
        //
            res.json( 'result' )
        })
        .catch(err => {
            console.log(err)
            res.status(500).json({ error: err.message })
        })

});

route.get('/get-active-orders', (req, res) => {
    Trade.find({})
        .then(orders => {
            Promise.all(orders.map(item => {
                let params = {
                    symbol: item.pair,
                    interval: item.interval,
                    limit: 50
                };
                const addedApiUrl = '/api/v1/klines';

                return axios({
                    method: 'get',
                    params,
                    url: baseUrl + addedApiUrl
                })
                    .then(resp => {
                        const result = resp.data.map(data => {
                            return {
                                'Open time': new Date(data[0] + infelicity),
                                Open: +data[1],
                                High: +data[2],
                                Low: +data[3],
                                Close: +data[4],
                                currentPrice: +data[4],
                                Volume: +data[5],
                                'Close time': new Date(data[6] + infelicity),
                                'Quote asset volume': +data[7],
                                'Number of trades': +data[8],
                                'Taker buy base asset volume': +data[9],
                                'Taker buy quote asset volume': +data[10],
                                Ignore: +data[11]
                            };
                        });
                        return {
                            _id: item._id,
                            createdAt: item.createdAt,
                            buyPrice: item.buyPrice || false,
                            data: result,
                            currentPrice: result[result.length - 1]['Close'],
                            interval: item.interval,
                            pair: item.pair,
                            closePrice: item.closePrice,
                            localMin: item.localMin,
                            takeProfit: item.takeProfit,
                            buyLimit1: item.buyLimit1,
                            buyLimit2: item.buyLimit2,
                            buyLimit3: item.buyLimit3,
                            comment: item.comment
                        }
                    })
            }))
                .then(orders => {
                    res.json({ orders })
                })
        })
        .catch(err => res.status(500).json({ error: err.message }))
});

route.get('/renew-order/:id/:symbol/:interval', (req, res) => {
    const { id, interval, symbol } = req.params;
    const limit = 50;
    
    Trade.findByIdAndRemove(id)
        .then(() => getKline({ symbol, interval, limit}))
        .then(data => {
            new Trade({
                pair: symbol,
                interval,
                session: shortId.generate()
            }).save().then(order => res.json({ ...order }))
        })
        .catch(err => res.status(500).json({ error: err.message }))
});

route.get('/delete-order/:_id', (req, res) => {
    Trade.findByIdAndRemove(req.params._id)
        .then(() => res.json(`success deleted ${req.params._id} order`))
        .catch(err => res.status(500).json({ error: err.message }))
});

route.get('/buy-pair/:pair/:time/:id/:currentPrice', (req, res) => {
    const { pair, time, id, currentPrice } = req.params;
    Trade.findByIdAndUpdate(id, { $set: { buyPrice: +currentPrice, createdAt: Date.now() + infelicity } }, { new: true })
        .then((trade) => {
            res.json({
                buyPrice: trade.buyPrice,
                createdAt: trade.createdAt
            })
        })
        .catch(err => {
            res.status(500).json({ error: err.response ? err.response.data : err.message })
        })



    // const addedApiUrl = '/api/v1/klines';
    // let params = {
    //     symbol: pair,
    //     interval: (!time || time === 'undefined' ) ? '1h' : time,
    //     limit: 1
    //     // endTime: Date.now()
    // };
    // axios({
    //     method: 'get',
    //     params,
    //     url: baseUrl + addedApiUrl
    // })
    //     .then(resp => {
    //         Trade.findByIdAndUpdate(id, { $set: { buyPrice: +resp.data[0][4], createdAt: Date.now() + infelicity } }, { new: true })
    //             .then((trade) => {
    //                 res.json({
    //                     buyPrice: trade.buyPrice,
    //                     createdAt: trade.createdAt
    //                 })
    //             })
    //     })
    //     .catch(err => {
    //         res.status(500).json({ error: err.response ? err.response.data.error.msg : err.message })
    //     })
});

route.get('/get-result', (req, res) => {
    newResult().then(result => {
        res.json({ result })
    })
        .catch(err => res.status(500).json({ error: err }))
});

route.get('/close-order/:id/:pair/:time/:buyDate', (req, res) => {
    const { id, pair, time, buyDate } = req.params;

    const addedApiUrl = '/api/v1/klines';
    let params = {
        symbol: pair,
        interval: time,
        limit: 1
        // endTime: Date.now()
    };
    axios({
        method: 'get',
        params,
        url: baseUrl + addedApiUrl
    })
        .then(resp => {
            Trade.findByIdAndUpdate(id, { $set: { closePrice: +resp.data[0][4] } }, { new: true })
                .then((trade) => {
                    if(trade.buyPrice && trade.closePrice) {
                        const diff = (trade.closePrice - trade.buyPrice) / (trade.buyPrice / 100) - 0.2;
                        new Result({
                            pair,
                            session: trade.session,
                            buyDate,
                            result: diff
                        }).save()
                            .then(() => {
                                newResult().then(result => {
                                    res.json({
                                        closePrice: trade.closePrice,
                                        result
                                    });
                                })
                            })
                    } else {
                        res.status(404).json({ error: 'No buy price' })
                    }

                })
        })
        .catch(err => {
            res.status(500).json({ error: err.response ? err.response.data.error.msg : err.message })
        })
});

route.get('/start-bot/:interval', (req, res) => {
    const { interval } = req.params;
    let hour = new Date().getHours();
    startBot(interval)
    const timer = setInterval(() => {
        console.log(new Date())
        const nowHour = new Date().getHours();
        const min = new Date().getMinutes();
        if(nowHour > hour) {
            hour = nowHour;
            startBot(interval);
        };
    }, 1000 * 300);
    res.redirect('/show-orders');
});

route.post('/delete-unused', (req, res) => {
    const { orders } = req.body;
    Promise.all(orders.map(item => Trade.findByIdAndRemove(item._id)))
        .then(() => res.json('success'))
        .catch(err => res.status(500).json({ error: 'Error on server side while deleting unused orders' }))
});

route.post('/limits', (req, res) => {
    const { order, price, id } = req.body;

    Trade.findByIdAndUpdate(id, { $set: { [order]: +price } }, { new: true })
        .then(order => {
            res.json({ order })
        })
        .catch(err => res.status(500).json({ error: err.message }))
});

route.post('/rabbit-pair', (req, res) => {
    const {  interval, limit} = req.body;
    axios({
        url: baseUrl + '/api/v1/exchangeInfo',
        method: 'get'
    })
        .then(resp => {
            const symbols = resp.data.symbols;
            symbols.forEach(item => {
                publish('', item.symbol, new Buffer('qweqweqwe'));
            });
        })
});


export default route;


