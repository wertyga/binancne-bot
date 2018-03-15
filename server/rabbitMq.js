import amqp from 'amqplib/callback_api';
import axios from 'axios';
import Trade from './models/trade';
import shortId from 'short-id';

import { io } from './index';
import { analyzeData } from './getData';
import {exponentialMovingAverage, macdCalculate, simpleMA, signalMACD} from './common/ema';
import config from './common/config';

const baseUrl = config.baseEndPoint;
export const infelicity = 10800000;

let amqpConn = null;
export function start() {
    amqp.connect('amqp://localhost', function(err, conn) {
        if (err) {
            console.error("[AMQP]", err.message);
            return setTimeout(start, 1000);
        }
        conn.on("error", function(err) {
            if (err.message !== "Connection closing") {
                console.error("[AMQP] conn error", err.message);
            }
        });
        conn.on("close", function() {
            console.error("[AMQP] reconnecting");
            return setTimeout(start, 1000);
        });
        console.log("[AMQP] connected");
        amqpConn = conn;
        whenConnected();
    });
};

let pubChannel = null;
function startPublisher() {
    amqpConn.createConfirmChannel(function(err, ch) {
        if (closeOnErr(err)) return;
        ch.on("error", function(err) {
            console.error("[AMQP] channel error", err.message);
        });
        ch.on("close", function() {
            console.log("[AMQP] channel closed");
        });

        pubChannel = ch;
    });
};

export function publish(exchange, routingKey, content) {
    try {
        pubChannel.publish(exchange, routingKey, content, { persistent: true },
            function(err, ok) {
                if (err) {
                    console.error("[AMQP] publish", err);

                    pubChannel.connection.close();
                };
            });
    } catch (e) {
        console.error("[AMQP] publish", e.message);
    }
};

export function startWorker(pair) {
        amqpConn.createChannel(function(err, ch) {
            if (closeOnErr(err)) return;
            ch.on("error", function(err) {
                console.error("[AMQP] channel error", err.message);
            });
            ch.on("close", function() {
                console.log("[AMQP] channel closed");
            });

            ch.prefetch(10);
            ch.assertQueue(pair, {durable: true}, function(err, q) {
                if (closeOnErr(err)) return;
                ch.consume(pair, processMsg, { noAck: false });
                console.log("Worker is started");
            });

            function processMsg(msg) {
                work(msg, function(ok) {
                    try {
                        if (ok)
                            ch.ack(msg);
                        else
                            ch.reject(msg, true);
                    } catch (e) {
                        closeOnErr(e);
                    }
                });
            };
        })

};

function work(msg, cb) {
    const { pair, interval, limit } = JSON.parse(msg.content.toString());

    console.log(msg.content.toString())
    cb(true)


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
    return axios({
        method: 'get',
        params,
        url: baseUrl + '/api/v1/klines'
    })
};