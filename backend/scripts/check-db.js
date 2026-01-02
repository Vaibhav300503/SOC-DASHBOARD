import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Log from './models/Log.js';
import Event from './models/Event.js';
import Agent from './models/Agent.js';

dotenv.config();

const mongoURI = process.env.MONGODB_URI || 'mongodb://ML:MLadmin@100.68.123.13:27017/soc_platform?authSource=admin';

async function checkData() {
    try {
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');

        const logCount = await Log.countDocuments();
        const eventCount = await Event.countDocuments();
        const agentCount = await Agent.countDocuments();

        console.log('Total Logs:', logCount);
        console.log('Total Events:', eventCount);
        console.log('Total Agents:', agentCount);

        if (logCount > 0) {
            const latestLog = await Log.findOne().sort({ createdAt: -1 });
            console.log('Latest Log:', JSON.stringify(latestLog, null, 2));
        }

        if (eventCount > 0) {
            const latestEvent = await Event.findOne().sort({ createdAt: -1 });
            console.log('Latest Event:', JSON.stringify(latestEvent, null, 2));
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkData();
