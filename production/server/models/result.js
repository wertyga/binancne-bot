'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _api = require('../routes/api');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var resultSchema = _mongoose2.default.Schema({
    pair: String,
    buyDate: Date,
    session: String,
    result: {
        type: Number,
        set: function set(v) {
            return +v.toFixed(2);
        }
    }
});

exports.default = _mongoose2.default.model('result', resultSchema);