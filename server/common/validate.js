import jwt from 'jsonwebtoken';

import clientConfig from './clientConfig';

import isEmpty from 'lodash/isEmpty';

export function validateInput(data, opt) {
    let errors = {};

    for(let key in data) {
        if(opt && opt.ignore.indexOf(key) !== -1) continue;
        if(key === 'email') {
            const emailRegExp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            if(!data[key].match(emailRegExp)) {
                errors[key] = 'Не похоже это на e-mail адрес';
            };
        };
        if(!data[key]) errors[key] = 'Поле не должно быть пустым';
    };
    if(data.confirmPass && data.password !== data.confirmPass) errors.confirmPass = 'Пароли не совпадают';

    return {
        errors,
        isValid: isEmpty(errors)
    }
};

export function validateToken(token) {
    try {
        jwt.verify(token, clientConfig.secret);
        return true;
    } catch(err) {
        return false;
    }
};