import axios from 'axios';

import { globalError } from "./errors";

export const SET_PAIR_DATA = 'SET_PAIR_DATA';
export const FETCH_PAIRS = 'FETCH_PAIRS';
export const GET_BOT_DATA = 'GET_BOT_DATA';
export const GET_TRADES = 'GET_TRADES';
export const SET_RESULT = 'SET_RESULT';



export function getResult() {
    return dispatch => {
        return axios.get('/api/get-result')
            .then(res => dispatch(showResult(res.data.result)))
    };
};
function showResult(result) {
    return {
        type: SET_RESULT,
        result
    }
};

export function deleteOrder(_id) {
    return dispatch => {
        return axios.get(`/api/delete-order/${_id}`)
    }
};

export function getActiveOrders() {
    return dispatch => {
        return axios.get('/api/get-active-orders')
            .then(res => dispatch(getTrades(res.data.orders)))
            .catch(err => {
                throw err;
            })
    }
};

export const getCandleData = (pair, time, limit) => {
    return dispatch => {
        return axios.get(`/api/fetch-pair/${pair}/${time}/${limit}`)
            .then(res => dispatch(dispatchPairData(res.data.data)))
            .catch(err => {
                err = err.response ? err.response.data.error : err.message;
                // dispatch(globalError(err));
                throw err;
            })
    }
};
const dispatchPairData = data => {
    return {
        type: SET_PAIR_DATA,
        data
    }
};

export function closeOrder(opt) {
    const { pair, interval, id, buyDate } = opt;
    return dispatch => {
        return axios.get(`/api/close-order/${id}/${pair}/${interval}/${buyDate}`)
            .then(res => {
                dispatch(showResult(res.data.result));
                return res;
            })
    }
};

export function fetchPairsData() {
    return dispatch => {
        return axios.get('/api/get-pairs')
            .then(res => dispatch(fetchPairs(res.data.symbols)))
            .catch(err => {
                err = err.response ? err.response.data.error : err.message;
                // dispatch(globalError(err));
                throw err;
            })
    }
};
function fetchPairs(pairs) {
    return {
        type: FETCH_PAIRS,
        pairs
    }
};

export function launcnBot(interval) {
    return dispatch => {
        return axios.get(`/api/get-bot/${interval}`)
            // .then(res => {
            //     // dispatch(getBotData(res.data.result));
            // })
            .catch(err => {
                err = err.response ? err.response.data.error : err.message;
                throw err;
            })
    };
};
function getBotData(data) {
    return {
        type: GET_BOT_DATA,
        data
    }
};
function getTrades(trades) {
    return {
        type: GET_TRADES,
        trades
    }
}