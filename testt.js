import axios from 'axios';
import config from './server/common/config';

const baseUrl = 'https://api.binance.com';

function analyzeData(interval='1h') {
    // Get pairs
    const limit = 50;
    return axios({
        url: baseUrl + '/api/v1/exchangeInfo',
        method: 'get'
    })
        .then(resp => {
            const arr = resp.data.symbols.map(item => getKline(item.symbol, interval));
            return Promise.all(arr)
        })
        .then(resp => console.log(resp)) // Hе работает(просто бесконечно висит)
};

export function getKline(symbol, interval) {
    return axios({
        method: 'get',
        params: {
            symbol,
            interval,
            limit: 50
        },
        url: baseUrl + '/api/v1/klines'
    })
        .then(resp => {
            return {
                pair: symbol,
                data: resp.data
            }
        });

};

analyzeData()