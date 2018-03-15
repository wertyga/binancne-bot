import mongoose from 'mongoose';
import { infelicity } from '../routes/api';

const resultSchema = mongoose.Schema({
    pair: String,
    buyDate: Date,
    session: String,
    result: {
        type: Number,
        set: v => +v.toFixed(2)
    }
});

export default mongoose.model('result', resultSchema);