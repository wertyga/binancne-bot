import validator from 'validator';
import isEmpty from 'lodash/isEmpty';

export default function(data) {
    var errors = {};

    // if(validator.isEmail(data.email)) errors.email = 'Wrong e-mail type';
    if(validator.isEmpty(data.name)) errors.name = 'Field can\'t be blank';
    if(validator.isEmpty(data.password)) errors.password = 'Field can\'t be blank';

    return {
        errors: errors,
        isValid: isEmpty(errors)
    }
};