import express from 'express';
import bodyParser from 'body-parser';

import path from 'path';
import cluster from 'cluster';
import http from 'http';
import EventEmitter from 'events';
export const ee = new EventEmitter();

import config from './common/config';
const log = require('./common/log')(module);
import mongoose from './common/mongoose';
// import sessionStore from './common/sessionStore';
// import session from 'express-session';
import { start } from './rabbitMq';
import api from './routes/api';

// ****************** Import routes *************


//***********************************************

const dev = process.env.NODE_ENV ? process.env.NODE_ENV.trim() === 'development' : true;


const app = express();
const server = http.Server(app);
export const io = require('socket.io')(server);

if (dev ? false : cluster.isMaster) {

    let cpuCount = require('os').cpus().length;

    for (let i = 0; i < cpuCount; i += 1) {
        cluster.schedulingPolicy = cluster.SCHED_NONE;
        cluster.fork();
    }

    cluster.on('exit', function (worker) {
        console.log('Worker ' + worker.id + ' died :(');
        cluster.fork();
    });

} else {



    //****************** Webpack ********************
    if(dev) {
        const webpack = require('webpack');
        const webpackConfig = require('../webpack.dev.config.js');
        const webpackHotMiddleware = require('webpack-hot-middleware');
        const webpackMiddleware = require('webpack-dev-middleware');

        const compiler = webpack(webpackConfig);

        app.use(webpackMiddleware(compiler, {
            hot: true,
            publicPath: webpackConfig.output.publicPath,
            noInfo: true
        }));
        app.use(webpackHotMiddleware(compiler));
    }

    //**********************************************

    app.use(bodyParser.json());
    // app.use(cookieParser());
    if(!dev) app.use(express.static(path.join(__dirname, '..', 'client', 'static')));
    app.use(express.static(path.join(__dirname, config.uploads.directory)));

    //************************* GARBAGE magic ***********************************

    // Для работы с garbage collector запустите проект с параметрами:
    // node --nouse-idle-notification --expose-gc app.js
    if(!dev) {
        let gcInterval;

        function init() {
            gcInterval = setInterval(function () {
                gcDo();
            }, 60000);
        };

        function gcDo() {
            global.gc();
            clearInterval(gcInterval);
            init();
        };

        init();
    }

    //************************************************************

    //******************************** Routes ***************************

    app.use('/api', api);

    app.get('/*', (req, res) => {
        res.sendFile(path.join(__dirname, 'index.html'))
    });


    //******************************** Run server ***************************

    server.listen(config.PORT, () => console.log(`Server run on ${config.PORT} port`));
};

//******************************** Uncaught Exception ***************************

process.on('uncaughtException', function (err) {
    log.error((new Date).toUTCString() + ' uncaughtException:', err.message);
    log.error(err.stack);
    process.exit(1);
});






