'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var log = require('./log')(module);

_mongoose2.default.set('debug', true);
_mongoose2.default.Promise = require('bluebird');

_mongoose2.default.connect(_config2.default.mongoose.uri, { useMongoClient: true }, function (err, db) {
    if (err) {
        log.error(err.message);
    } else {
        db.once('open', function () {
            return console.log('-- Mongoose connect --');
        });
    };
}), _config2.default.mongoose.options;

exports.default = _mongoose2.default;