import { combineReducers } from 'redux';
import globalError  from './globalError';
import pairs  from './pairs';
import botData from './botData';
import trades from './activeTrades';
import result from './result';


export default combineReducers({
    globalError,
    pairs,
    botData,
    trades,
    result
});