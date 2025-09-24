import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import projectModel from './models/project.model.js';
import { generateResult } from './services/ai.service.js';
import { saveMessage } from './services/message.service.js';

const port = process.env.PORT || 8000;

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

// Socket authentication middleware
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(' ')[1];
        const projectId = socket.handshake.query.projectId;

        if (!token) {
            return next(new Error('Authentication error'));
        }

        if (!projectId) {
            return next(new Error('Project ID is required'));
        }

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return next(new Error('Invalid projectId'));
        }

        socket.project = await projectModel.findById(projectId);

        if (!token) {
            return next(new Error('Authentication error'))
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded) {
            return next(new Error('Authentication error'))
        }

        socket.user = decoded;

        next();

    } catch (error) {
        next(error)
    }

})


io.on('connection', socket => {
    socket.roomId = socket.project._id.toString()

    console.log('a user connected');

    socket.join(socket.roomId);

    socket.on('project-message', async data => {
        try {
            // Save user message to database
            if (data.sender._id !== 'ai') {
                let messageToSave = data.message;
                let messageType = 'user_message';
                
                // If it's an AI request, extract the actual prompt
                if (data.type === 'ai_request') {
                    try {
                        const messageData = JSON.parse(data.message);
                        messageToSave = messageData.prompt; // Save the actual prompt
                        messageType = 'ai_request';
                    } catch (e) {
                        console.error('Error parsing AI request:', e);
                        messageToSave = data.message; // Fallback to original message
                    }
                }
                
                await saveMessage({
                    projectId: socket.roomId,
                    sender: data.sender,
                    message: messageToSave,
                    messageId: data.messageId,
                    type: messageType
                });
            }

            if (data.type === 'ai_request') {
                const messageData = JSON.parse(data.message);
                const { prompt, codeContext, currentFile, currentFolder, fileTree, messageId } = messageData;
                
                // Build comprehensive context string
                let contextStr = '';
                
                // Add current folder context
                if (currentFolder) {
                    contextStr += `Current folder: ${currentFolder}\n`;
                    contextStr += 'Files in current context:\n';
                    Object.entries(fileTree || {}).forEach(([path, item]) => {
                        // Show files in current folder and subfolders
                        if (path === currentFolder || path.startsWith(currentFolder + '/')) {
                            const relativePath = path === currentFolder ? '.' : 
                                path.substring(currentFolder.length + 1);
                            contextStr += `- ${relativePath} (${item.type})\n`;
                        }
                    });
                    contextStr += '\n';
                } else {
                    // Show root level files
                    contextStr += 'Current folder: Root\n';
                    contextStr += 'Files in current context:\n';
                    Object.entries(fileTree || {}).forEach(([path, item]) => {
                        if (!path.includes('/')) {
                            contextStr += `- ${path} (${item.type})\n`;
                        }
                    });
                    contextStr += '\n';
                }
                
                // Add ALL files for reference (including subfolders)
                contextStr += 'All files in project (for reference):\n';
                Object.entries(fileTree || {}).forEach(([path, item]) => {
                    contextStr += `- ${path} (${item.type})\n`;
                });
                contextStr += '\n';
                
                // Add current file context if available
                if (codeContext && currentFile) {
                    const displayFile = currentFile.startsWith('./') ? 
                        currentFile.substring(2) : currentFile;
                    contextStr += `Current file (${displayFile}):\n${codeContext}\n\n`;
                }
                
                // Add complete file tree for navigation context
                contextStr += 'Complete file tree for reference:\n';
                Object.entries(fileTree || {}).forEach(([path, item]) => {
                    contextStr += `- ${path} (${item.type})\n`;
                });
                contextStr += '\n';
                
                contextStr += `Request: ${prompt}\n\n`;
                contextStr += 'Instructions:\n';
                contextStr += '1. When creating files, use simple paths without "./" prefix (e.g., "filename.js" not "./filename.js")\n';
                contextStr += '2. For subfolders, use relative paths (e.g., "utils/helper.js")\n';
                contextStr += '3. You can reference and update existing files by their path\n';
                contextStr += '4. When updating files, provide the complete updated content\n';
                
                // Generate AI response with enhanced context
                const result = await generateResult(contextStr);
                console.log('AI generated result:', result);
                
                // Save AI response to database
                await saveMessage({
                    projectId: socket.roomId,
                    sender: {
                        _id: 'ai',
                        email: 'AI'
                    },
                    message: result,
                    messageId: messageId,
                    type: 'ai_response'
                });
                
                io.to(socket.roomId).emit('project-message', {
                    message: result,
                    sender: {
                        _id: 'ai',
                        email: 'AI'
                    },
                    messageId: messageId // Include message ID to prevent duplicates
                });
                return;
            }
            
            socket.broadcast.to(socket.roomId).emit('project-message', data);
        } catch (error) {
            console.error('Error handling project message:', error);
        }
    })

    socket.on('disconnect', () => {
        console.log('user disconnected');
        socket.leave(socket.roomId)
    });
});

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})