'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.infelicity = undefined;

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

exports.getSocketDataKline = getSocketDataKline;
exports.getDepthData = getDepthData;
exports.newResult = newResult;
exports.getResult = getResult;
exports.analyzeData = analyzeData;
exports.startBot = startBot;
exports.calculatePercentProfit = calculatePercentProfit;
exports.compareProfit = compareProfit;
exports.getKline = getKline;

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _index = require('./index.js');

var _shortId = require('short-id');

var _shortId2 = _interopRequireDefault(_shortId);

var _trade = require('./models/trade');

var _trade2 = _interopRequireDefault(_trade);

var _result = require('./models/result');

var _result2 = _interopRequireDefault(_result);

var _config = require('./common/config');

var _config2 = _interopRequireDefault(_config);

var _socketData = require('./socketData');

var _socketData2 = _interopRequireDefault(_socketData);

var _ema = require('./common/ema');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var baseUrl = _config2.default.baseEndPoint;
// const Promise = require('bluebird')

var infelicity = exports.infelicity = 10800000;
var comission = 0.05;

function getSocketDataKline(pair, interval) {
    var ws = new _socketData2.default();
    return ws.getKlineData(pair, interval);
};

function getDepthData(pair) {
    var levels = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 20;

    var ws = new _socketData2.default();
    return ws.getDepthData(pair, levels);
};

function newResult() {
    return _result2.default.find({}).then(function (results) {
        if (results.length > 0) {
            var sum = 0;
            var result = {};
            for (var i = 0; i < results.length; i++) {
                var session = results[i].session;
                if (!result[session]) {
                    result[session] = [results[i].result];
                } else {
                    result[session].push(results[i].result);
                }
            };
            for (var key in result) {
                sum += result[key].reduce(function (a, b) {
                    return a + b;
                }, 0) / result[key].length;
            };

            return +sum.toFixed(2);
        } else {
            return 0;
        }
    });
};

function getResult() {
    return _result2.default.find({}).then(function (results) {
        var result = {
            'BTC': 0,
            'ETH': 0,
            'BNB': 0
        };
        for (var i = 0; i < results.length; i++) {
            if (results[i].pair.indexOf('BTC') !== -1) {
                if (result['BTC'] === 0) {
                    result['BTC'] = +results[i].result;
                } else {
                    result['BTC'] += +results[i].result;
                };
            } else if (results[i].pair.indexOf('ETH') !== -1) {
                if (result['ETH'] === 0) {
                    result['ETH'] = +results[i].result;
                } else {
                    result['ETH'] += +results[i].result;
                };
            } else if (results[i].pair.indexOf('BNB') !== -1) {
                if (result['BNB'] === 0) {
                    result['BNB'] = +results[i].result;
                } else {
                    result['BNB'] += +results[i].result;
                };
            };
        };
        for (var key in result) {
            result[key] = +result[key].toFixed(2);
        };
        return result;
    });
};

function analyzeData() {
    var interval = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '1h';

    // Get pairs
    var limit = 50;
    var session = _shortId2.default.generate();
    return (0, _axios2.default)({
        url: baseUrl + '/api/v1/exchangeInfo',
        method: 'get'
    }).then(function (resp) {
        var i = 0;
        var prArr = resp.data.symbols.slice(0, 200).map(function (item) {
            return getKline(item.symbol, interval);
        });
        return _promise2.default.all(prArr);
    }).then(function (data) {
        console.log('ASDASDASASD');
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
        return data.filter(function (item) {
            return isNaN(+item.pair);
        }).map(function (item) {
            (0, _ema.exponentialMovingAverage)(item.data, 12);
            (0, _ema.exponentialMovingAverage)(item.data, 26);
            (0, _ema.simpleMA)(item.data, 7);
            (0, _ema.simpleMA)(item.data, 25);
            (0, _ema.macdCalculate)(item.data);
            var macdData = (0, _ema.signalMACD)(item.data);
            return {
                pair: item.pair,
                data: macdData
            };
        }).filter(function (item) {
            return !!item.data;
        });
    }).then(function (data) {
        var result = [];
        data.filter(function (order) {
            return order.pair.toLowerCase().indexOf('btc') !== -1;
        }).forEach(function (item) {
            var fmacd = item.data[item.data.length - 4].macd;
            var fsignal = item.data[item.data.length - 4].signal;
            var pmacd = item.data[item.data.length - 3].macd;
            var psignal = item.data[item.data.length - 3].signal;
            var lmacd = item.data[item.data.length - 2].macd;
            var lsignal = item.data[item.data.length - 2].signal;
            var nowmacd = item.data[item.data.length - 1].macd;
            var nowsignal = item.data[item.data.length - 1].signal;

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
            var sevenAndTwentyFiveEmaDiff = item.data[item.data.length - 3]['ma-7'] - item.data[item.data.length - 3]['ma-25'] < 0 && item.data[item.data.length - 2]['ma-7'] - item.data[item.data.length - 2]['ma-25'] >= 0 && item.data[item.data.length - 1]['ma-7'] - item.data[item.data.length - 1]['ma-25'] > 0;

            var threeUppers = item.data[item.data.length - 3]['ma-7'] < item.data[item.data.length - 2]['ma-7'] && item.data[item.data.length - 2]['ma-7'] < item.data[item.data.length - 1]['ma-7'];

            var threeDown = item.data[item.data.length - 3]['ma-7'] > item.data[item.data.length - 2]['ma-7'] && item.data[item.data.length - 2]['ma-7'] > item.data[item.data.length - 1]['ma-7'];

            var threeUppersMACD = fmacd < lmacd && pmacd < lmacd && lmacd < nowmacd;
            var threeDownMACD = fmacd > lmacd && pmacd > lmacd && lmacd > nowmacd;
            var divergentMACD = fmacd > pmacd && pmacd < lmacd && lmacd < nowmacd;

            var ma7UnderMa25 = item.data[item.data.length - 3]['ma-7'] < item.data[item.data.length - 3]['ma-25'] && item.data[item.data.length - 2]['ma-7'] < item.data[item.data.length - 2]['ma-25'] && item.data[item.data.length - 1]['ma-7'] < item.data[item.data.length - 1]['ma-25'];

            var pSignalMA7 = item.data[item.data.length - 3]['ma-7'];
            var lSignalMA7 = item.data[item.data.length - 2]['ma-7'];

            var pSignalDiff = item.data[item.data.length - 3]['ma-25'] - item.data[item.data.length - 3]['ma-7'];
            var lSignalDiff = item.data[item.data.length - 2]['ma-25'] - item.data[item.data.length - 2]['ma-7'];
            var nowSignalDiff = item.data[item.data.length - 1]['ma-25'] - item.data[item.data.length - 1]['ma-7'];

            var nowdiff = nowmacd - nowsignal;
            var ldiff = lmacd - lsignal;
            var pdiff = pmacd - psignal;
            var fdiff = fmacd - fsignal;

            var signalCross = fdiff < 0 && ldiff <= 0 && pdiff > 0 && nowdiff > 0;
            var signalWithMAS = ldiff > 0 && pdiff > 0 && nowdiff > 0;

            var coming = fmacd < pmacd && pmacd <= lmacd && pSignalMA7 <= lSignalMA7;
            var down = fmacd > pmacd && pmacd > lmacd && pSignalMA7 > lSignalMA7 && fmacd < 0 && pmacd < 0 && lmacd < 0 && nowmacd < 0;

            if (true) {
                result.push(item);
            };
        });

        if (result.length > 0) {
            return _promise2.default.all(result.map(function (item) {
                return new _trade2.default({
                    pair: item.pair,
                    session: session,
                    // localMin: item.min,
                    startPrice: item.data[item.data.length - 1].price,
                    // buyPrice: item.data[item.data.length - 1].price,
                    // createdAt: Date.now() + infelicity,
                    startTime: Date.now() + infelicity,
                    currentPrice: item.data[item.data.length - 1].price,
                    interval: interval
                }).save();
            })).then(function (trades) {
                return { result: result };
            });
        } else {
            return { result: result };
        }
    }).catch(function (err) {
        throw err;
    });
};

function startBot(interval, res) {
    var pair = void 0;
    analyzeData(interval).then(function (result) {
        result.result.forEach(function (item) {

            var ws = getSocketDataKline(item.pair, interval);
            ws.on('message', function (msg) {
                var message = JSON.parse(msg);
                var currentPrice = message.k.c;
                var msgPair = message.s;
                compareProfit(msgPair, currentPrice, ws);
                _index.io.emit('kline-' + item.pair, msg);
            });
            ws.on('error', function (err) {
                return console.log('ws: ', err);
            });
        });
        // res.end();
    }).catch(function (err) {
        // io.emit(`error-on-${item.pair}`, err.responsse ? err.response.data.error.msg : err.message)
        console.log(err);
    });
};

function calculatePercentProfit(currentPrice, buyPrice) {
    return +((+currentPrice - +buyPrice) / (+buyPrice / 100)).toFixed(2);
};
function compareProfit(pair, currentPrice, ws) {
    _trade2.default.findOne({ pair: pair }).then(function (trade) {
        var nowHour = new Date().getHours();
        // console.log(nowHour, trade.createdAt.getHours())
        // if(trade && trade.createdAt.getHours() > nowHour + 2) {
        //     trade.closePrice = currentPrice;
        //     trade.save();
        // };
        if (trade && trade.buyPrice && !trade.closePrice && calculatePercentProfit(+currentPrice, trade.buyPrice) > 2.5) {
            // calculatePercentProfit(+currentPrice, trade.buyPrice) < -2)) {

            _promise2.default.all([function () {
                var diff = (currentPrice - trade.buyPrice) / (trade.buyPrice / 100) - comission;
                new _result2.default({
                    pair: pair,
                    buyDate: trade.createdAt,
                    result: diff
                }).save();
            }(), function () {
                trade.closePrice = +currentPrice;
                trade.save();
            }()]).then(function () {
                newResult().then(function (result) {
                    ws.close();
                    _index.io.emit('close-kline-' + trade.pair, currentPrice);
                    _index.io.emit('set-result', result);
                });
            }).catch(function (err) {
                _index.io.emit('error-on-' + trade.pair, err.response ? err.response.data.error.msg : err.message);
            });
        };
    });
};

function getKline(symbol, interval) {
    // let params = {
    //     symbol,
    //     interval,
    //     limit: 50
    // };
    return (0, _axios2.default)({
        method: 'get',
        params: {
            symbol: symbol,
            interval: interval,
            limit: 50
        },
        url: baseUrl + '/api/v1/klines'
    }).then(function (resp) {
        return {
            pair: symbol,
            data: resp.data.map(function (data) {
                return {
                    time: new Date(data[0] + infelicity),
                    price: +data[4],
                    minPrice: +data[3]
                };
            })
        };
    });
};