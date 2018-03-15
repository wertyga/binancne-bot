import mongoose from 'mongoose';

import config from './config';
const log = require('./log')(module)

mongoose.set('debug', true);
mongoose.Promise = require('bluebird');

mongoose.connect(config.mongoose.uri, { useMongoClient: true }, (err, db) => {
    if(err) {
        log.error(err.message);
    } else {
        db.once('open', () => console.log('-- Mongoose connect --'));
    };
}), config.mongoose.options;


export default mongoose;