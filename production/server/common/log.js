'use strict';

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _winston = require('winston');

var _winston2 = _interopRequireDefault(_winston);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getLogger(module) {

    var pathName = module.filename.split('/').slice(-2).join('/');

    return new _winston2.default.Logger({
        transports: [new _winston2.default.transports.Console({
            colorize: true,
            level: 'debug',
            label: pathName
        }), new _winston2.default.transports.File({
            filename: _path2.default.join(__dirname, 'node.log'),
            label: pathName
        })]
    });
}

module.exports = getLogger;