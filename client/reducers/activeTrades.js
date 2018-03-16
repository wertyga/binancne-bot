import { GET_TRADES, CLOSE_ORDER } from '../actions/pairsAPI';

export default function error(state = [], action = {}) {
    switch(action.type) {

        case GET_TRADES:
            return action.trades;

        case CLOSE_ORDER:
            return state.map(item => {
                if(item._id === action.id) {
                    return {
                        ...item,
                        closePrice: action.closePrice
                    }
                } else {
                    return item;
                };
            });

        default: return state;
    }
};