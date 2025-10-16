const mongoose = require('mongoose');

const connect = async () => {
    try {
        await mongoose.connect(process.env.DATABASE_URL);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection failed:', error);
        process.exit(1); // exit app if DB connection fails
    }
};
module.exports = connect