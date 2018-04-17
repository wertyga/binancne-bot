'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.io = exports.ee = undefined;

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _cluster = require('cluster');

var _cluster2 = _interopRequireDefault(_cluster);

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _config = require('./common/config');

var _config2 = _interopRequireDefault(_config);

var _mongoose = require('./common/mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _rabbitMq = require('./rabbitMq');

var _api = require('./routes/api');

var _api2 = _interopRequireDefault(_api);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ee = exports.ee = new _events2.default();

var log = require('./common/log')(module);
// import sessionStore from './common/sessionStore';
// import session from 'express-session';


// ****************** Import routes *************


//***********************************************

var dev = process.env.NODE_ENV === 'development';
var test = process.env.NODE_ENV === 'test';
var prod = process.env.NODE_ENV === 'production';

var app = (0, _express2.default)();
var server = _http2.default.Server(app);
var io = exports.io = require('socket.io')(server);

if (prod && _cluster2.default.isMaster) {

    var cpuCount = require('os').cpus().length;

    for (var i = 0; i < cpuCount; i += 1) {
        _cluster2.default.schedulingPolicy = _cluster2.default.SCHED_NONE;
        _cluster2.default.fork();
    }

    _cluster2.default.on('exit', function (worker) {
        console.log('Worker ' + worker.id + ' died :(');
        _cluster2.default.fork();
    });
} else {

    server.listen(_config2.default.PORT, function () {
        return console.log('Server run on ' + _config2.default.PORT + ' port');
    });
};

if (prod) {
    var init = function init() {
        gcInterval = setInterval(function () {
            gcDo();
        }, 60000);
    };

    var gcDo = function gcDo() {
        global.gc();
        clearInterval(gcInterval);
        init();
    };

    //************************* GARBAGE magic ***********************************

    // Для работы с garbage collector запустите проект с параметрами:
    // node --nouse-idle-notification --expose-gc app.js
    var gcInterval = void 0;

    ;

    ;

    init();

    //************************************************************
};

//****************** Webpack ********************
if (dev) {
    var webpack = require('webpack');
    var webpackConfig = require('../webpack.dev.config.js');
    var webpackHotMiddleware = require('webpack-hot-middleware');
    var webpackMiddleware = require('webpack-dev-middleware');

    var compiler = webpack(webpackConfig);

    app.use(webpackMiddleware(compiler, {
        hot: true,
        publicPath: webpackConfig.output.publicPath,
        noInfo: true
    }));
    app.use(webpackHotMiddleware(compiler));
};

//**********************************************

app.use(_bodyParser2.default.json());
// app.use(cookieParser());
if (!dev) app.use(_express2.default.static(_path2.default.join(__dirname, '..', 'client', 'static')));
app.use(_express2.default.static(_path2.default.join(__dirname, _config2.default.uploads.directory)));
app.use(_express2.default.static(_path2.default.join(__dirname, '..', 'data')));

//******************************** Routes ***************************

app.use('/api', _api2.default);

app.get('/*', function (req, res) {
    res.sendFile(_path2.default.join(__dirname, 'index.html'));
});

//******************************** Uncaught Exception ***************************

process.on('uncaughtException', function (err) {
    log.error(new Date().toUTCString() + ' uncaughtException:', err.message);
    log.error(err.stack);
    process.exit(1);
});