import { ERROR } from '../actions/errors';

export default function error(state = '', action = {}) {
    switch(action.type) {

        case ERROR: {
            return action.error
        }

        default: return state;
    }
};