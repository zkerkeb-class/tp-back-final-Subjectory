import mongose from 'mongoose';

const connectDB = async () => {
    try {
        await mongose.connect('mongodb://localhost:27017/pokemon-database');
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        process.exit(1);
    }
};

connectDB();