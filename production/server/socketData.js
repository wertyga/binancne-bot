'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = undefined;

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _ws = require('ws');

var _ws2 = _interopRequireDefault(_ws);

var _socket = require('socket.io');

var _socket2 = _interopRequireDefault(_socket);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var BinanceIO = function () {
    function BinanceIO() {
        (0, _classCallCheck3.default)(this, BinanceIO);

        this._baseUrl = 'wss://stream.binance.com:9443/ws/';
        this.streams = {
            kline: function kline(pair, interval) {
                return pair.toLowerCase() + '@kline_' + interval;
            },
            depth: function depth(symbol, levels) {
                return symbol.toLowerCase() + '@depth' + levels;
            }
        };
    }

    (0, _createClass3.default)(BinanceIO, [{
        key: '_createSocket',
        value: function _createSocket(event) {
            return new _ws2.default(this._baseUrl + event);
        }
    }, {
        key: 'getKlineData',
        value: function getKlineData(symbol, interval) {
            return this._createSocket(this.streams.kline(symbol, interval));
        }
    }, {
        key: 'getDepthData',
        value: function getDepthData(symbol, levels) {
            return this._createSocket(this.streams.depth(symbol, levels));
        }
    }]);
    return BinanceIO;
}();

exports.default = BinanceIO;
;