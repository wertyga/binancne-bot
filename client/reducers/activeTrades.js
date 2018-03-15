import { GET_TRADES } from '../actions/pairsAPI';

export default function error(state = [], action = {}) {
    switch(action.type) {

        case GET_TRADES:
            return action.trades;

        default: return state;
    }
};