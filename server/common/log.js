import path from 'path';

import winston from 'winston';

function getLogger(module) {

    let pathName = module.filename.split('/').slice(-2).join('/');

    return new winston.Logger({
        transports:[
            new winston.transports.Console({
                colorize: true,
                level: 'debug',
                label: pathName
            }),
            new (winston.transports.File)({
                filename: path.join(__dirname, 'node.log'),
                label: pathName
            })
        ]
    });
}

module.exports = getLogger;