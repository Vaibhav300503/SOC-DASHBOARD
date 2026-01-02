import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const mongoURI = process.env.MONGODB_URI || 'mongodb://ML:MLadmin@100.68.123.13:27017/soc_platform?authSource=admin';

async function checkRawData() {
    try {
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));

        const rawLogs = await db.collection('raw_logs').findOne();
        console.log('Raw Log from raw_logs:', JSON.stringify(rawLogs, null, 2));

        const agents = await db.collection('agents').find().toArray();
        console.log('Agents:', JSON.stringify(agents, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkRawData();
