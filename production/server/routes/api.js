'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _config = require('../common/config');

var _config2 = _interopRequireDefault(_config);

var _shortId = require('short-id');

var _shortId2 = _interopRequireDefault(_shortId);

var _index = require('../index');

var _trade = require('../models/trade');

var _trade2 = _interopRequireDefault(_trade);

var _result = require('../models/result');

var _result2 = _interopRequireDefault(_result);

var _getData = require('../getData');

var _rabbitMq = require('../rabbitMq');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var route = _express2.default.Router();
var baseUrl = _config2.default.baseEndPoint;
var start = 0;

// io.on('connection', socket => {
//     console.log('connect socket')
// });

route.get('/fetch-pair/:pair/:time/:limit/', function (req, res) {
    var _req$params = req.params,
        pair = _req$params.pair,
        time = _req$params.time,
        limit = _req$params.limit;


    if (!pair || pair === 'undefined') {
        res.status(400).json({ error: 'choose pair' });
        return;
    };
    var addedApiUrl = '/api/v1/klines';
    var params = {
        symbol: pair,
        interval: !time || time === 'undefined' ? '1h' : time
        // endTime: Date.now()
    };
    if (limit && limit !== 'undefined') params.limit = limit;
    (0, _axios2.default)({
        method: 'get',
        params: params,
        url: baseUrl + addedApiUrl
    }).then(function (resp) {
        var result = resp.data.map(function (data) {
            return {
                'Open time': new Date(data[0] + _getData.infelicity),
                Open: +data[1],
                High: +data[2],
                Low: +data[3],
                Close: +data[4],
                Volume: +data[5],
                'Close time': new Date(data[6] + _getData.infelicity),
                'Quote asset volume': +data[7],
                'Number of trades': +data[8],
                'Taker buy base asset volume': +data[9],
                'Taker buy quote asset volume': +data[10],
                Ignore: +data[11]
            };
        });
        res.json({ data: result });
    }).catch(function (err) {
        res.status(500).json({ error: err.response ? err.response.data.error.msg : err.message });
    });
});

route.get('/fetch-exist-pair/:pair/:time/:_id', function (req, res) {
    var _req$params2 = req.params,
        _id = _req$params2._id,
        pair = _req$params2.pair,
        time = _req$params2.time;


    var addedApiUrl = '/api/v1/klines';
    var params = {
        symbol: pair,
        interval: !time || time === 'undefined' ? '1h' : time,
        limit: 50
        // endTime: Date.now()
    };
    (0, _axios2.default)({
        method: 'get',
        params: params,
        url: baseUrl + addedApiUrl
    }).then(function (resp) {
        var result = resp.data.map(function (data) {
            return {
                'Open time': new Date(data[0] + _getData.infelicity),
                Open: +data[1],
                High: +data[2],
                Low: +data[3],
                Close: +data[4],
                Volume: +data[5],
                'Close time': new Date(data[6] + _getData.infelicity),
                'Quote asset volume': +data[7],
                'Number of trades': +data[8],
                'Taker buy base asset volume': +data[9],
                'Taker buy quote asset volume': +data[10],
                Ignore: +data[11]
            };
        });
        _trade2.default.findById(_id).then(function (pair) {
            res.json({
                pair: (0, _extends3.default)({}, pair, {
                    currentPrice: result[result.length - 1]['Close']
                }),
                data: result
            });
        });
    }).catch(function (err) {
        return res.status(500).json({ error: err.message });
    });
});

route.get('/get-pairs', function (req, res) {
    var addedApiUrl = '/api/v1/exchangeInfo';
    (0, _axios2.default)({
        method: 'get',
        url: baseUrl + addedApiUrl
    }).then(function (resp) {
        var symbols = resp.data.symbols.map(function (item) {
            return item.symbol;
        });
        res.json({ symbols: symbols });
    }).catch(function (err) {
        return res.status(500).json({ error: err.response ? err.response.data.error.msg : err.message });
    });
});

route.get('/fetch-socket-data/:pair/:interval', function (req, res) {
    var depthLevels = 20;
    var _req$params3 = req.params,
        pair = _req$params3.pair,
        interval = _req$params3.interval;

    var ws = (0, _getData.getSocketDataKline)(pair, interval);
    var depthWs = (0, _getData.getDepthData)(pair, depthLevels);
    ws.on('message', function (msg) {
        // const currentPrice = +JSON.parse(msg).k.c;
        // compareProfit(pair, currentPrice)
        _index.io.emit('kline-' + pair, msg);
    });
    ws.on('error', function (err) {
        console.log(err);
    });

    ws.on('close', function () {
        console.log('Close socket');
    });
    // depthWs.on('message', msg => {
    //     io.emit(`depth-${pair}`, JSON.parse(msg));
    // });
    res.end();
});

route.post('/comment', function (req, res) {
    var _req$body = req.body,
        comment = _req$body.comment,
        id = _req$body.id;


    _trade2.default.findByIdAndUpdate(id, { $set: { comment: comment } }).then(function () {
        return res.json('comment edited');
    }).catch(function (err) {
        return res.status(500).json({ error: err.message });
    });
});

route.get('/get-bot/:interval', function (req, res) {
    var interval = req.params.interval;
    (0, _getData.analyzeData)(interval).then(function (result) {
        //     // result.result.forEach(item => {
        //     //     const ws = getSocketDataKline(item.pair, interval);
        //     //     ws.on('message', msg => {
        //     //         io.emit(`kline-${item.pair}`, msg)
        //     //     });
        //     // });
        //
        res.json('result');
    }).catch(function (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    });
});

route.get('/get-active-orders', function (req, res) {
    _trade2.default.find({}).then(function (orders) {
        _promise2.default.all(orders.map(function (item) {
            var params = {
                symbol: item.pair,
                interval: item.interval,
                limit: 50
            };
            var addedApiUrl = '/api/v1/klines';

            return (0, _axios2.default)({
                method: 'get',
                params: params,
                url: baseUrl + addedApiUrl
            }).then(function (resp) {
                var result = resp.data.map(function (data) {
                    return {
                        'Open time': new Date(data[0] + _getData.infelicity),
                        Open: +data[1],
                        High: +data[2],
                        Low: +data[3],
                        Close: +data[4],
                        currentPrice: +data[4],
                        Volume: +data[5],
                        'Close time': new Date(data[6] + _getData.infelicity),
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
                    startPrice: item.startPrice,
                    closePrice: item.closePrice,
                    localMin: item.localMin,
                    takeProfit: item.takeProfit,
                    buyLimit1: item.buyLimit1,
                    buyLimit2: item.buyLimit2,
                    buyLimit3: item.buyLimit3,
                    comment: item.comment,
                    startTime: item.startTime
                };
            });
        })).then(function (orders) {
            res.json({ orders: orders });
        });
    }).catch(function (err) {
        return res.status(500).json({ error: err.message });
    });
});

route.get('/renew-order/:id/:symbol/:interval', function (req, res) {
    var _req$params4 = req.params,
        id = _req$params4.id,
        interval = _req$params4.interval,
        symbol = _req$params4.symbol;

    var limit = 50;

    _trade2.default.findByIdAndRemove(id).then(function () {
        return (0, _getData.getKline)({ symbol: symbol, interval: interval, limit: limit });
    }).then(function (data) {
        new _trade2.default({
            pair: symbol,
            interval: interval,
            session: _shortId2.default.generate()
        }).save().then(function (order) {
            return res.json((0, _extends3.default)({}, order));
        });
    }).catch(function (err) {
        return res.status(500).json({ error: err.message });
    });
});

route.get('/delete-order/:_id', function (req, res) {
    _trade2.default.findByIdAndRemove(req.params._id).then(function () {
        return res.json('success deleted ' + req.params._id + ' order');
    }).catch(function (err) {
        return res.status(500).json({ error: err.message });
    });
});

route.get('/buy-pair/:pair/:time/:id/:currentPrice', function (req, res) {
    var _req$params5 = req.params,
        pair = _req$params5.pair,
        time = _req$params5.time,
        id = _req$params5.id,
        currentPrice = _req$params5.currentPrice;

    _trade2.default.findByIdAndUpdate(id, { $set: { buyPrice: +currentPrice, createdAt: Date.now() + _getData.infelicity } }, { new: true }).then(function (trade) {
        res.json({
            buyPrice: trade.buyPrice,
            createdAt: trade.createdAt
        });
    }).catch(function (err) {
        res.status(500).json({ error: err.response ? err.response.data : err.message });
    });

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

route.get('/get-result', function (req, res) {
    (0, _getData.newResult)().then(function (result) {
        res.json({ result: result });
    }).catch(function (err) {
        return res.status(500).json({ error: err });
    });
});

route.get('/close-order/:id/:pair/:time/:buyDate', function (req, res) {
    var _req$params6 = req.params,
        id = _req$params6.id,
        pair = _req$params6.pair,
        time = _req$params6.time,
        buyDate = _req$params6.buyDate;


    var addedApiUrl = '/api/v1/klines';
    var params = {
        symbol: pair,
        interval: time,
        limit: 1
        // endTime: Date.now()
    };
    (0, _axios2.default)({
        method: 'get',
        params: params,
        url: baseUrl + addedApiUrl
    }).then(function (resp) {
        _trade2.default.findByIdAndUpdate(id, { $set: { closePrice: +resp.data[0][4] } }, { new: true }).then(function (trade) {
            if (trade.buyPrice && trade.closePrice) {
                var diff = (trade.closePrice - trade.buyPrice) / (trade.buyPrice / 100) - 0.2;
                new _result2.default({
                    pair: pair,
                    session: trade.session,
                    buyDate: buyDate,
                    result: diff
                }).save().then(function () {
                    (0, _getData.newResult)().then(function (result) {
                        res.json({
                            closePrice: trade.closePrice,
                            result: result
                        });
                    });
                });
            } else {
                res.status(404).json({ error: 'No buy price' });
            }
        });
    }).catch(function (err) {
        res.status(500).json({ error: err.response ? err.response.data.error.msg : err.message });
    });
});

route.get('/start-bot/:interval', function (req, res) {
    var interval = req.params.interval;

    var hour = new Date().getHours();
    (0, _getData.startBot)(interval);
    var timer = setInterval(function () {
        console.log(new Date());
        var nowHour = new Date().getHours();
        var min = new Date().getMinutes();
        if (nowHour > hour) {
            hour = nowHour;
            (0, _getData.startBot)(interval);
        };
    }, 1000 * 300);
    res.redirect('/show-orders');
});

route.post('/delete-unused', function (req, res) {
    var orders = req.body.orders;

    _promise2.default.all(orders.map(function (item) {
        return _trade2.default.findByIdAndRemove(item._id);
    })).then(function () {
        return res.json('success');
    }).catch(function (err) {
        return res.status(500).json({ error: 'Error on server side while deleting unused orders' });
    });
});

route.post('/limits', function (req, res) {
    var _req$body2 = req.body,
        order = _req$body2.order,
        price = _req$body2.price,
        id = _req$body2.id;


    _trade2.default.findByIdAndUpdate(id, { $set: (0, _defineProperty3.default)({}, order, +price) }, { new: true }).then(function (order) {
        res.json({ order: order });
    }).catch(function (err) {
        return res.status(500).json({ error: err.message });
    });
});

route.post('/rabbit-pair', function (req, res) {
    var _req$body3 = req.body,
        interval = _req$body3.interval,
        limit = _req$body3.limit;

    (0, _axios2.default)({
        url: baseUrl + '/api/v1/exchangeInfo',
        method: 'get'
    }).then(function (resp) {
        var symbols = resp.data.symbols;
        symbols.forEach(function (item) {
            (0, _rabbitMq.publish)('', item.symbol, new Buffer('qweqweqwe'));
        });
    });
});

exports.default = route;