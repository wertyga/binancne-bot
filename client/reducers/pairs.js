import { SET_PAIR_DATA, FETCH_PAIRS } from '../actions/pairsAPI';

export default function error(state = { pairs: [], data: []}, action = {}) {
    switch(action.type) {

        case SET_PAIR_DATA:
            return {
                ...state,
                data: action.data
            };

        case FETCH_PAIRS:
            return {
                ...state,
                pairs: action.pairs
            };

        default: return state;
    }
};