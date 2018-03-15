import mongoose from 'mongoose';

const { Schema } = mongoose;

const UserSchema = new Schema({
    name: {
        type: String
    },
    hashPassword: {
        type: String
    }
}, { timestamps: true });

export default mongoose.model('admin', UserSchema)