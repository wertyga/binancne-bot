'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _mongoose = require('./mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var session = require('express-session');

var mongoStore = require('connect-mongo')(session);

var sessionStore = new mongoStore({ mongooseConnection: _mongoose2.default.connection });

exports.default = sessionStore;