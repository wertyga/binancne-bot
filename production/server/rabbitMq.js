'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.infelicity = undefined;
exports.start = start;
exports.publish = publish;
exports.startWorker = startWorker;

var _callback_api = require('amqplib/callback_api');

var _callback_api2 = _interopRequireDefault(_callback_api);

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _trade = require('./models/trade');

var _trade2 = _interopRequireDefault(_trade);

var _shortId = require('short-id');

var _shortId2 = _interopRequireDefault(_shortId);

var _index = require('./index');

var _getData = require('./getData');

var _ema = require('./common/ema');

var _config = require('./common/config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var baseUrl = _config2.default.baseEndPoint;
var infelicity = exports.infelicity = 10800000;

var amqpConn = null;
function start() {
    _callback_api2.default.connect('amqp://localhost', function (err, conn) {
        if (err) {
            console.error("[AMQP]", err.message);
            return setTimeout(start, 1000);
        }
        conn.on("error", function (err) {
            if (err.message !== "Connection closing") {
                console.error("[AMQP] conn error", err.message);
            }
        });
        conn.on("close", function () {
            console.error("[AMQP] reconnecting");
            return setTimeout(start, 1000);
        });
        console.log("[AMQP] connected");
        amqpConn = conn;
        whenConnected();
    });
};

var pubChannel = null;
function startPublisher() {
    amqpConn.createConfirmChannel(function (err, ch) {
        if (closeOnErr(err)) return;
        ch.on("error", function (err) {
            console.error("[AMQP] channel error", err.message);
        });
        ch.on("close", function () {
            console.log("[AMQP] channel closed");
        });

        pubChannel = ch;
    });
};

function publish(exchange, routingKey, content) {
    try {
        pubChannel.publish(exchange, routingKey, content, { persistent: true }, function (err, ok) {
            if (err) {
                console.error("[AMQP] publish", err);

                pubChannel.connection.close();
            };
        });
    } catch (e) {
        console.error("[AMQP] publish", e.message);
    }
};

function startWorker(pair) {
    amqpConn.createChannel(function (err, ch) {
        if (closeOnErr(err)) return;
        ch.on("error", function (err) {
            console.error("[AMQP] channel error", err.message);
        });
        ch.on("close", function () {
            console.log("[AMQP] channel closed");
        });

        ch.prefetch(10);
        ch.assertQueue(pair, { durable: true }, function (err, q) {
            if (closeOnErr(err)) return;
            ch.consume(pair, processMsg, { noAck: false });
            console.log("Worker is started");
        });

        function processMsg(msg) {
            work(msg, function (ok) {
                try {
                    if (ok) ch.ack(msg);else ch.reject(msg, true);
                } catch (e) {
                    closeOnErr(e);
                }
            });
        };
    });
};

function work(msg, cb) {
    var _JSON$parse = JSON.parse(msg.content.toString()),
        pair = _JSON$parse.pair,
        interval = _JSON$parse.interval,
        limit = _JSON$parse.limit;

    console.log(msg.content.toString());
    cb(true);
};

function whenConnected() {
    startPublisher();
};

function closeOnErr(err) {
    if (!err) return false;
    console.error("[AMQP] error", err);
    amqpConn.close();
    return true;
};

function getKline(params) {
    return (0, _axios2.default)({
        method: 'get',
        params: params,
        url: baseUrl + '/api/v1/klines'
    });
};