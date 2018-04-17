'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _api = require('../routes/api');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var tradesSchema = _mongoose2.default.Schema({
    pair: String,
    buyPrice: { type: Number, default: 0 },
    interval: String,
    session: String,
    closePrice: { type: Number, default: 0 },
    localMin: {
        position: { type: Number, default: 0 },
        price: { type: Number, default: 0 }
    },
    startPrice: { type: Number, default: 0 },
    startTime: { type: Date },
    comment: { type: String, default: '' },
    takeProfit: { type: Number, default: 0 },
    buyLimit1: { type: Number, default: 0 },
    buyLimit2: { type: Number, default: 0 },
    buyLimit3: { type: Number, default: 0 },
    createdAt: {
        type: Date
    }
});

exports.default = _mongoose2.default.model('trade', tradesSchema);