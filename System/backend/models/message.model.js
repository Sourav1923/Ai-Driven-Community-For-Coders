import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    sender: {
        _id: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        }
    },
    message: {
        type: String,
        required: true
    },
    messageId: {
        type: String,
        unique: true,
        sparse: true
    },
    type: {
        type: String,
        enum: ['user_message', 'ai_request', 'ai_response'],
        default: 'user_message'
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for efficient querying by project
messageSchema.index({ projectId: 1, timestamp: 1 });

const messageModel = mongoose.model('Message', messageSchema);

export default messageModel; 