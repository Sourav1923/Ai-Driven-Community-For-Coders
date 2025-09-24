import messageModel from '../models/message.model.js';

// Save a new message to the database
export const saveMessage = async ({ projectId, sender, message, messageId, type = 'user_message' }) => {
    try {
        const newMessage = await messageModel.create({
            projectId,
            sender,
            message,
            messageId,
            type
        });
        return newMessage;
    } catch (error) {
        console.error('Error saving message:', error);
        throw error;
    }
};

// Get all messages for a specific project
export const getProjectMessages = async ({ projectId }) => {
    try {
        const messages = await messageModel
            .find({ projectId })
            .sort({ timestamp: 1 })
            .limit(100); // Limit to last 100 messages for performance
        
        return messages;
    } catch (error) {
        console.error('Error getting project messages:', error);
        throw error;
    }
};

// Delete messages for a project (useful for cleanup)
export const deleteProjectMessages = async ({ projectId }) => {
    try {
        await messageModel.deleteMany({ projectId });
        return true;
    } catch (error) {
        console.error('Error deleting project messages:', error);
        throw error;
    }
};

// Get message count for a project
export const getProjectMessageCount = async ({ projectId }) => {
    try {
        const count = await messageModel.countDocuments({ projectId });
        return count;
    } catch (error) {
        console.error('Error getting message count:', error);
        throw error;
    }
}; 