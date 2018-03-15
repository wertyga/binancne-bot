export const ERROR = 'ERROR';

export function globalError(err) {
    return {
        type: ERROR,
        error: err
    }
};

export function setGlobalError(err) {
    return dispatch => {
        dispatch(globalError(err))
    }
};