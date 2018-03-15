import { GET_BOT_DATA } from '../actions/pairsAPI';

export default function error(state = [], action = {}) {
    switch(action.type) {

        case GET_BOT_DATA:
            return action.data;

        default: return state;
    }
};