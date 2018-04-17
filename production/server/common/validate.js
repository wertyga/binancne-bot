'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.validateInput = validateInput;
exports.validateToken = validateToken;

var _jsonwebtoken = require('jsonwebtoken');

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _clientConfig = require('./clientConfig');

var _clientConfig2 = _interopRequireDefault(_clientConfig);

var _isEmpty = require('lodash/isEmpty');

var _isEmpty2 = _interopRequireDefault(_isEmpty);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function validateInput(data, opt) {
    var errors = {};

    for (var key in data) {
        if (opt && opt.ignore.indexOf(key) !== -1) continue;
        if (key === 'email') {
            var emailRegExp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            if (!data[key].match(emailRegExp)) {
                errors[key] = 'Не похоже это на e-mail адрес';
            };
        };
        if (!data[key]) errors[key] = 'Поле не должно быть пустым';
    };
    if (data.confirmPass && data.password !== data.confirmPass) errors.confirmPass = 'Пароли не совпадают';

    return {
        errors: errors,
        isValid: (0, _isEmpty2.default)(errors)
    };
};

function validateToken(token) {
    try {
        _jsonwebtoken2.default.verify(token, _clientConfig2.default.secret);
        return true;
    } catch (err) {
        return false;
    }
};