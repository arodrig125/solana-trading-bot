const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

console.log('Connecting to MongoDB...');
console.log('Admin Username:', process.env.ADMIN_USERNAME);
const mongoose = require('mongoose');
const User = require('../models/User');

async function createAdminUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        const adminUser = new User({
            username: process.env.ADMIN_USERNAME,
            password: process.env.ADMIN_PASSWORD_HASH,
            role: 'admin',
            active: true
        });

        await adminUser.save();
        console.log('Admin user created successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin user:', error);
        process.exit(1);
    }
}

createAdminUser();
