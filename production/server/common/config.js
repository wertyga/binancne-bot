'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
    PORT: 3000,
    mongoose: {
        uri: 'mongodb://localhost/trades',
        options: {
            server: {
                socketOptions: {
                    keepAlive: 1
                }
            }
        }
    },
    baseEndPoint: 'https://api.binance.com',
    session: {
        secret: "nodeJSForever",
        key: "sid",
        cookie: {
            httpOnly: true,
            maxAge: 3600000
        }
    },
    hash: {
        secret: 'boooom!',
        salt: 10
    },
    uploads: {
        directory: 'productsImages',
        destination: _path2.default.join(__dirname, '../', 'productsImages')
    }
};