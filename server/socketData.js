import WebSocket from 'ws';
import io from 'socket.io';

export default class BinanceIO {
    constructor() {
        this._baseUrl = 'wss://stream.binance.com:9443/ws/';
        this.streams = {
            kline: (pair, interval) => `${pair.toLowerCase()}@kline_${interval}`,
            depth: (symbol, levels) => `${symbol.toLowerCase()}@depth${levels}`
        };
    };

    _createSocket(event) {
        return new WebSocket(this._baseUrl + event);
    };

    getKlineData(symbol, interval) {
        return this._createSocket(this.streams.kline(symbol, interval))
    };

    getDepthData(symbol, levels) {
        return this._createSocket(this.streams.depth(symbol, levels))
    };

};