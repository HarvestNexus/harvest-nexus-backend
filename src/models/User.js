const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    storage_name: String,
    email_or_phone: String,
    storage_location: String, 
    storage_type: String,
    password: String,
    created_at: { type: Date, default: Date.now }
})

const User = mongoose.model('User', UserSchema);

module.exports = User;