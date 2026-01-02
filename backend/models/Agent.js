import mongoose from 'mongoose';

const agentSchema = new mongoose.Schema({
    agent_id: { type: String, required: true, unique: true },
    agent_version: String,
    endpoint_name: { type: String, required: true },
    hostname: String,
    ip_address: String,
    os_type: String,
    status: { type: String, default: 'active' },
    last_seen: Date,
    first_registered: Date,
    labels: [String],
    stats: {
        buffer_size_bytes: Number
    }
}, {
    timestamps: true,
    collection: 'agents'
});

// Index for faster queries
agentSchema.index({ endpoint_name: 1 });
agentSchema.index({ agent_id: 1 });
agentSchema.index({ status: 1 });
agentSchema.index({ last_seen: -1 });

export default mongoose.model('Agent', agentSchema);
