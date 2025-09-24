import express from 'express';
import { saveMessage, getProjectMessages, deleteProjectMessages } from '../services/message.service.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Get all messages for a project
router.get('/project/:projectId', authenticateToken, async (req, res) => {
    try {
        const { projectId } = req.params;
        
        if (!projectId) {
            return res.status(400).json({ error: 'Project ID is required' });
        }

        const messages = await getProjectMessages({ projectId });
        
        res.json({ 
            success: true, 
            messages: messages.map(msg => ({
                sender: msg.sender,
                message: msg.message,
                messageId: msg.messageId,
                type: msg.type,
                timestamp: msg.timestamp
            }))
        });
    } catch (error) {
        console.error('Error getting project messages:', error);
        res.status(500).json({ error: 'Failed to get project messages' });
    }
});

// Save a new message
router.post('/save', authenticateToken, async (req, res) => {
    try {
        const { projectId, sender, message, messageId, type } = req.body;
        
        if (!projectId || !sender || !message) {
            return res.status(400).json({ error: 'Project ID, sender, and message are required' });
        }

        const savedMessage = await saveMessage({
            projectId,
            sender,
            message,
            messageId,
            type
        });
        
        res.json({ 
            success: true, 
            message: savedMessage 
        });
    } catch (error) {
        console.error('Error saving message:', error);
        res.status(500).json({ error: 'Failed to save message' });
    }
});

// Delete all messages for a project (admin only)
router.delete('/project/:projectId', authenticateToken, async (req, res) => {
    try {
        const { projectId } = req.params;
        
        if (!projectId) {
            return res.status(400).json({ error: 'Project ID is required' });
        }

        await deleteProjectMessages({ projectId });
        
        res.json({ 
            success: true, 
            message: 'All project messages deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting project messages:', error);
        res.status(500).json({ error: 'Failed to delete project messages' });
    }
});

export default router; 