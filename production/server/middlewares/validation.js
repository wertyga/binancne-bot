'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = function (data) {
    var errors = {};

    // if(validator.isEmail(data.email)) errors.email = 'Wrong e-mail type';
    if (_validator2.default.isEmpty(data.name)) errors.name = 'Field can\'t be blank';
    if (_validator2.default.isEmpty(data.password)) errors.password = 'Field can\'t be blank';

    return {
        errors: errors,
        isValid: (0, _isEmpty2.default)(errors)
    };
};

var _validator = require('validator');

var _validator2 = _interopRequireDefault(_validator);

var _isEmpty = require('lodash/isEmpty');

var _isEmpty2 = _interopRequireDefault(_isEmpty);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

;