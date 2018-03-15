import mongoose from 'mongoose';
import { infelicity } from '../routes/api';

const tradesSchema = mongoose.Schema({
    pair: String,
    buyPrice: { type: Number, default: 0 },
    interval: String,
    session: String,
    closePrice: { type: Number, default: 0 },
    localMin: {
        position: { type: Number, default: 0 },
        price: { type: Number, default: 0 }
    },
    comment: { type: String, default: '' },
    takeProfit: { type: Number, default: 0 },
    buyLimit1: { type: Number, default: 0 },
    buyLimit2: { type: Number, default: 0 },
    buyLimit3: { type: Number, default: 0 },
    createdAt: {
        type: Date
    }
});

export default mongoose.model('trade', tradesSchema);