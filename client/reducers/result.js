import { SET_RESULT } from '../actions/pairsAPI';

export default function error(state = 0, action = {}) {
    switch(action.type) {

        case SET_RESULT:
            return action.result;

        default: return state;
    }
};