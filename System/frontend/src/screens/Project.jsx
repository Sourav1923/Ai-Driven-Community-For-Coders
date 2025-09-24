import React, { useState, useEffect, useContext, useRef } from 'react';
import { UserContext } from '../context/user.context';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../config/axios';
import { initializeSocket, receiveMessage, sendMessage } from '../config/socket';
import Markdown from 'markdown-to-jsx';
import executionService from '../services/execution.service';
import dockerExecutionService from '../services/docker.service';
import Terminal from './Terminal';
import CodeEditor from '../components/CodeEditor';
import FolderManager from '../components/FolderManager';
import LanguageSelector from '../components/LanguageSelector';
import ExecutionResults from '../components/ExecutionResults';
import DockerExecution from '../components/DockerExecution';

function SyntaxHighlightedCode(props) {
    const ref = useRef(null);

    React.useEffect(() => {
        if (ref.current && props.className?.includes('lang-') && window.hljs) {
            window.hljs.highlightElement(ref.current);
            ref.current.removeAttribute('data-highlighted');
        }
    }, [props.className, props.children]);

    return <code {...props} ref={ref} />;
}

const Project = () => {
    const location = useLocation();
    const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(new Set());
    const [project, setProject] = useState(location.state.project);
    const [message, setMessage] = useState('');
    const { user } = useContext(UserContext);
    const messageBox = React.createRef();
    const textareaRef = useRef(null);
    const [users, setUsers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [fileTree, setFileTree] = useState({});
    const [currentFile, setCurrentFile] = useState(null);
    const [openFiles, setOpenFiles] = useState([]);
    const [selectedLanguage, setSelectedLanguage] = useState('javascript');
    const [executionResult, setExecutionResult] = useState(null);
    const [isExecuting, setIsExecuting] = useState(false);
    const [darkMode, setDarkMode] = useState(true);
    const [terminalLogs, setTerminalLogs] = useState([]);
    const [isTerminalOpen, setIsTerminalOpen] = useState(false);
    const [isExecutionResultsVisible, setIsExecutionResultsVisible] = useState(true);
    const [activeTab, setActiveTab] = useState('code'); // 'code' or 'docker'
    const [isUpdatingContainers, setIsUpdatingContainers] = useState(false);

    const handleUserClick = (id) => {
        setSelectedUserId((prevSelectedUserId) => {
            const newSelectedUserId = new Set(prevSelectedUserId);
            if (newSelectedUserId.has(id)) {
                newSelectedUserId.delete(id);
            } else {
                newSelectedUserId.add(id);
            }
            return newSelectedUserId;
        });
    };

    function addCollaborators() {
        axios
            .put('/projects/add-user', {
                projectId: location.state.project._id,
                users: Array.from(selectedUserId),
            })
            .then((res) => {
                console.log(res.data);
                setIsModalOpen(false);
            })
            .catch((err) => {
                console.log(err);
            });
    }

    const send = () => {
        if (message.startsWith('@ai')) {
            // Extract code context and prompt
            const prompt = message.substring(3).trim();
            const codeContext = currentFile && fileTree[currentFile]?.type === 'file' ? 
                fileTree[currentFile].contents : '';
            
            // Get current folder context
            const currentFolder = currentFile ? 
                currentFile.split('/').slice(0, -1).join('/') : '';
            
            // Generate unique message ID to prevent duplicates
            const messageId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
            
            // Send to AI with code and folder context
            sendMessage('project-message', {
                message: JSON.stringify({
                    prompt,
                    codeContext,
                    currentFile,
                    currentFolder,
                    messageId,
                    fileTree: fileTree // Send ALL files so AI can access any file in the project
                }),
                sender: user, // Use the actual user object
                type: 'ai_request'
            });
        } else {
            // Generate unique message ID for regular messages
            const messageId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
            
            sendMessage('project-message', {
                message,
                sender: user,
                messageId
            });
        }
        setMessages((prevMessages) => [...prevMessages, { sender: user, message }]);
        setMessage('');
    };

    function WriteAiMessage(message) {
        const messageObject = JSON.parse(message);
        return (
            <div className='overflow-auto bg-gradient-to-r from-gray-800 to-gray-700 text-gray-100 rounded-lg p-3 shadow-lg'>
                <Markdown
                    children={messageObject.text}
                    options={{
                        overrides: {
                            code: SyntaxHighlightedCode,
                        },
                    }}
                />
            </div>
        );
    }

    useEffect(() => {
        initializeSocket(project._id);
        // Initialize execution service with default language
        executionService.setLanguage(selectedLanguage);

        // Load existing messages from database
        const loadMessages = async () => {
            try {
                const response = await axios.get(`/messages/project/${project._id}`);
                if (response.data.success) {
                    console.log('Current user ID:', user._id, 'Type:', typeof user._id);
                    console.log('Loaded messages:', response.data.messages);
                    
                    // Process messages to ensure proper format
                    const processedMessages = response.data.messages.map(msg => {
                        console.log('Message sender ID:', msg.sender._id, 'Type:', typeof msg.sender._id);
                        
                        // Fix messages with incorrect sender ID (legacy issue)
                        if (msg.sender._id === 'user' && msg.type === 'ai_request') {
                            console.log('Fixing message with incorrect sender ID:', msg);
                            return {
                                ...msg,
                                sender: {
                                    _id: user._id.toString(),
                                    email: user.email
                                }
                            };
                        }
                        
                        // For AI responses, ensure they're properly formatted
                        if (msg.sender._id === 'ai') {
                            try {
                                // Try to parse the message as JSON to check if it's already processed
                                const parsedMessage = JSON.parse(msg.message);
                                // If it has a 'text' property, it's already processed
                                if (parsedMessage.text) {
                                    return msg; // Already in correct format
                                }
                            } catch (e) {
                                // If parsing fails, it might be a raw message
                                console.log('Message parsing failed:', e);
                            }
                        }
                        
                        // For AI requests, format them properly for display
                        if (msg.type === 'ai_request') {
                            return {
                                ...msg,
                                message: `@ai ${msg.message}` // Add @ai prefix for display
                            };
                        }
                        
                        return msg;
                    });
                    setMessages(processedMessages);
                    // Scroll to bottom after messages are loaded
                    setTimeout(() => {
                        if (messageBox.current) {
                            messageBox.current.scrollTop = messageBox.current.scrollHeight;
                        }
                    }, 100);
                }
            } catch (error) {
                console.error('Error loading messages:', error);
            }
        };

        // Only load messages if user context is available
        if (user && user._id) {
            loadMessages();
        }

        receiveMessage('project-message', (data) => {
            if (data.sender._id === 'ai') {
                console.log('AI message received:', data);
                const message = JSON.parse(data.message);
                console.log('Parsed AI message:', message);
                
                if (message.fileTree) {
                    console.log('File tree found in AI response:', message.fileTree);
                    // Process AI-generated file tree
                    const processedFileTree = Object.entries(message.fileTree).reduce((acc, [path, item]) => {
                        let processedPath = path;
                        
                        // Handle relative paths properly
                        if (path.startsWith('./')) {
                            // Remove './' and use the path directly
                            processedPath = path.substring(2);
                        } else if (path.startsWith('/')) {
                            // Remove leading slash for root paths
                            processedPath = path.substring(1);
                        }
                        
                        // If path is empty after processing, skip it
                        if (!processedPath) return acc;
                        
                        acc[processedPath] = item;
                        return acc;
                    }, {});
                    
                    console.log('Processed file tree:', processedFileTree);
                    
                    // Update file tree and save to backend
                    setFileTree(prev => {
                        const newFileTree = { ...prev, ...processedFileTree };
                        console.log('AI created files:', processedFileTree);
                        // Save to backend
                        saveFileTree(newFileTree);
                        return newFileTree;
                    });
                } else {
                    console.log('No fileTree found in AI response');
                }
                
                // Prevent duplicate messages by checking message ID
                setMessages((prevMessages) => {
                    const messageExists = prevMessages.some(msg => 
                        msg.sender._id === 'ai' && 
                        (msg.message === data.message || msg.messageId === data.messageId)
                    );
                    return messageExists ? prevMessages : [...prevMessages, data];
                });
            } else {
                setMessages((prevMessages) => [...prevMessages, data]);
            }
        });

        axios
            .get(`/projects/get-project/${location.state.project._id}`)
            .then((res) => {
                setProject(res.data.project);
                setFileTree(res.data.project.fileTree || {});
            });

        axios
            .get('/users/all')
            .then((res) => {
                setUsers(res.data.users);
            })
            .catch((err) => {
                console.log(err);
            });
    }, [project._id, selectedLanguage]);

    // Reload messages when user context becomes available
    useEffect(() => {
        if (user && user._id && project._id) {
            const loadMessages = async () => {
                try {
                    const response = await axios.get(`/messages/project/${project._id}`);
                    if (response.data.success) {
                        console.log('Current user ID:', user._id, 'Type:', typeof user._id);
                        console.log('Loaded messages:', response.data.messages);
                        
                        // Process messages to ensure proper format
                        const processedMessages = response.data.messages.map(msg => {
                            console.log('Message sender ID:', msg.sender._id, 'Type:', typeof msg.sender._id);
                            
                            // Fix messages with incorrect sender ID (legacy issue)
                            if (msg.sender._id === 'user' && msg.type === 'ai_request') {
                                console.log('Fixing message with incorrect sender ID:', msg);
                                return {
                                    ...msg,
                                    sender: {
                                        _id: user._id.toString(),
                                        email: user.email
                                    }
                                };
                            }
                            
                            // For AI responses, ensure they're properly formatted
                            if (msg.sender._id === 'ai') {
                                try {
                                    // Try to parse the message as JSON to check if it's already processed
                                    const parsedMessage = JSON.parse(msg.message);
                                    // If it has a 'text' property, it's already processed
                                    if (parsedMessage.text) {
                                        return msg; // Already in correct format
                                    }
                                } catch (e) {
                                    // If parsing fails, it might be a raw message
                                    console.log('Message parsing failed:', e);
                                }
                            }
                            
                            // For AI requests, format them properly for display
                            if (msg.type === 'ai_request') {
                                return {
                                    ...msg,
                                    message: `@ai ${msg.message}` // Add @ai prefix for display
                                };
                            }
                            
                            return msg;
                        });
                        setMessages(processedMessages);
                        // Scroll to bottom after messages are loaded
                        setTimeout(() => {
                            if (messageBox.current) {
                                messageBox.current.scrollTop = messageBox.current.scrollHeight;
                            }
                        }, 100);
                    }
                } catch (error) {
                    console.error('Error loading messages:', error);
                }
            };
            
            loadMessages();
        }
    }, [user, project._id]);

    function saveFileTree(ft) {
        axios
            .put('/projects/update-file-tree', {
                projectId: project._id,
                fileTree: ft,
            })
            .then((res) => {
                console.log(res.data);
                // Check if there are any running containers for this project
                updateRunningContainers(ft);
            })
            .catch((err) => {
                console.log(err);
            });
    }

    // Update running containers when file tree changes
    async function updateRunningContainers(newFileTree) {
        try {
            setIsUpdatingContainers(true);
            const containers = await dockerExecutionService.getActiveContainers();
            const projectContainers = containers.data.filter(container => 
                container.projectId === project._id
            );

            let updatedCount = 0;
            for (const container of projectContainers) {
                if (container.status === 'running') {
                    try {
                        await dockerExecutionService.updateProjectFromTree(container.containerId, newFileTree);
                        console.log(`Updated container ${container.containerId} with new file tree`);
                        updatedCount++;
                    } catch (error) {
                        console.error(`Failed to update container ${container.containerId}:`, error);
                    }
                }
            }

            if (updatedCount > 0) {
                console.log(`Updated ${updatedCount} running container(s) with new file tree`);
            }
        } catch (error) {
            console.error('Error updating running containers:', error);
        } finally {
            setIsUpdatingContainers(false);
        }
    }

    function handleFileChange(newContent) {
        const ft = {
            ...fileTree,
            [currentFile]: {
                type: 'file',
                contents: newContent,
            },
        };
        setFileTree(ft);
        saveFileTree(ft);
    }

    function getFileLanguage(filename) {
        return executionService.detectLanguageFromFile(filename);
    }

    const handleLanguageChange = (language) => {
        setSelectedLanguage(language);
        executionService.setLanguage(language);
    };

    const executeCurrentFile = async () => {
        if (!currentFile || !fileTree[currentFile]) {
            setTerminalLogs(prev => [...prev, 'No file selected or file not found']);
            return;
        }

        setIsExecuting(true);
        setTerminalLogs(prev => [...prev, `Executing ${currentFile} with ${selectedLanguage}...`]);

        try {
            const sourceCode = fileTree[currentFile].contents;
            const result = await executionService.execute(sourceCode);

            setExecutionResult(result);
            
            if (result.success) {
                setTerminalLogs(prev => [
                    ...prev, 
                    '✅ Execution successful!',
                    `Output: ${result.output}`,
                    `Execution time: ${result.executionTime}ms`,
                    `Memory used: ${result.memory}KB`
                ]);
            } else {
                setTerminalLogs(prev => [
                    ...prev, 
                    '❌ Execution failed!',
                    `Error: ${result.error}`,
                    `Status: ${result.status?.description || 'Unknown error'}`
                ]);
            }
        } catch (error) {
            setTerminalLogs(prev => [...prev, `❌ Execution error: ${error.message}`]);
        } finally {
            setIsExecuting(false);
        }
    };

    function sendToNext(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            send();
        }
    }

    const autoResizeTextarea = (element) => {
        element.style.height = 'auto';
        const newHeight = Math.max(element.scrollHeight, 40); // Ensure minimum height of 40px
        element.style.height = newHeight + 'px';
    };

    // Function to scroll to bottom of messages
    const scrollToBottom = () => {
        if (messageBox.current) {
            console.log('Scrolling to bottom...');
            console.log('Current scroll height:', messageBox.current.scrollHeight);
            console.log('Current client height:', messageBox.current.clientHeight);
            console.log('Current scroll top:', messageBox.current.scrollTop);
            
            // Force immediate scroll to bottom without smooth behavior
            messageBox.current.scrollTop = messageBox.current.scrollHeight;
            
            // Double-check scroll position after a brief delay
            setTimeout(() => {
                if (messageBox.current) {
                    const isAtBottom = messageBox.current.scrollTop + messageBox.current.clientHeight >= messageBox.current.scrollHeight - 10;
                    console.log('After scroll - scroll top:', messageBox.current.scrollTop);
                    console.log('After scroll - is at bottom:', isAtBottom);
                    if (!isAtBottom) {
                        messageBox.current.scrollTop = messageBox.current.scrollHeight;
                        console.log('Forced scroll again');
                    }
                }
            }, 50);
            
            // Try one more time after a longer delay
            setTimeout(() => {
                if (messageBox.current) {
                    messageBox.current.scrollTop = messageBox.current.scrollHeight;
                    console.log('Final scroll attempt');
                }
            }, 200);
        }
    };

    // Auto-resize textarea when message changes
    useEffect(() => {
        if (textareaRef.current) {
            autoResizeTextarea(textareaRef.current);
        }
    }, [message]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (messageBox.current && messages.length > 0) {
            console.log('Messages changed, scrolling to bottom...');
            console.log('Number of messages:', messages.length);
            
            // Use requestAnimationFrame for better timing
            requestAnimationFrame(() => {
                if (messageBox.current) {
                    messageBox.current.scrollTop = messageBox.current.scrollHeight;
                    console.log('Scroll attempt 1');
                }
            });
            
            // Also try again after a short delay to ensure it works
            setTimeout(() => {
                if (messageBox.current) {
                    messageBox.current.scrollTop = messageBox.current.scrollHeight;
                    console.log('Scroll attempt 2');
                }
            }, 50);
            
            // Try one more time after a longer delay
            setTimeout(() => {
                if (messageBox.current) {
                    messageBox.current.scrollTop = messageBox.current.scrollHeight;
                    console.log('Scroll attempt 3');
                }
            }, 200);
        }
    }, [messages]);

    // Initial scroll to bottom when component mounts
    useEffect(() => {
        if (messageBox.current && messages.length > 0) {
            console.log('Component mounted, scrolling to bottom...');
            setTimeout(() => {
                if (messageBox.current) {
                    messageBox.current.scrollTop = messageBox.current.scrollHeight;
                    console.log('Initial scroll completed');
                }
            }, 100);
        }
    }, []);

    return (
        <main className={`h-screen w-screen flex ${darkMode ? 'dark' : ''}`}>
            {/* Left Section - Chat Panel */}
            <section className="left relative flex flex-col h-screen min-w-96 bg-gradient-to-b from-gray-900 to-gray-800">
                {/* Header */}
                <header className='flex justify-between items-center p-2 px-4 w-full bg-gray-800 shadow-lg absolute z-10 top-0'>
                    <button
                        className='flex gap-2 text-gray-100 hover:text-blue-400 transition-colors'
                        onClick={() => setIsModalOpen(true)}
                    >
                        <i className="ri-add-fill mr-1"></i>
                        <p>Add collaborator</p>
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
                            className='p-2 text-gray-100 hover:text-blue-400 transition-colors'
                        >
                            <i className="ri-group-fill"></i>
                        </button>
                    </div>
                </header>

                {/* Conversation Area */}
                <div className="conversation-area pt-14 flex-grow flex flex-col h-full">
                    <div
                        ref={messageBox}
                        className="message-box p-1 flex-grow flex flex-col gap-2 overflow-y-auto"
                        style={{ height: 'calc(100vh - 200px)' }}
                    >
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`${msg.sender._id === 'ai' ? 'max-w-80' : 'max-w-52'} ${(msg.sender._id === user._id.toString() || msg.sender._id === user._id) && 'ml-auto'} message flex flex-col p-2 bg-gray-700 rounded-lg shadow-md`}
                            >
                                <small className='opacity-65 text-xs text-gray-300'>{msg.sender.email}</small>
                                <div className='text-sm text-gray-100'>
                                    {msg.sender._id === 'ai' ?
                                        WriteAiMessage(msg.message)
                                        : <p>{msg.message}</p>}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Input Field */}
                    <div className="inputField w-full flex bg-gray-800 p-2 border-t border-gray-700">
                        <div className="flex-grow bg-gray-700 rounded-lg flex items-end">
                            <textarea
                                ref={textareaRef}
                                value={message}
                                onChange={(e) => {
                                    setMessage(e.target.value);
                                }}
                                onKeyDown={sendToNext}
                                className='p-3 px-4 border-none outline-none flex-grow bg-transparent text-gray-100 placeholder-gray-400 resize-none'
                                placeholder='Type @ai for AI assistance...'
                                style={{ minHeight: '40px', maxHeight: '120px', overflowY: 'hidden' }}
                            />
                            <button
                                onClick={send}
                                className='w-8 h-8 bg-blue-600 text-white hover:bg-blue-700 rounded-full transition-colors flex items-center justify-center flex-shrink-0 m-2'
                            >
                                <i className="ri-send-plane-fill text-xs"></i>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Side Panel - Collaborators */}
                <div className={`sidePanel w-full h-full flex flex-col gap-2 bg-gray-800 absolute transition-all ${isSidePanelOpen ? 'translate-x-0' : '-translate-x-full'} top-0 shadow-2xl`}>
                    <header className='flex justify-between items-center px-4 p-2 bg-gray-700'>
                        <h1 className='font-semibold text-lg text-gray-100'>Collaborators</h1>
                        <button
                            onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
                            className='p-2 text-gray-100 hover:text-blue-400 transition-colors'
                        >
                            <i className="ri-close-fill"></i>
                        </button>
                    </header>
                    <div className="users flex flex-col gap-2 p-2">
                        {project.users && project.users.map(user => (
                            <div
                                key={user._id}
                                className="user cursor-pointer hover:bg-gray-700 p-2 flex gap-2 items-center rounded-lg transition-colors"
                            >
                                <div className='aspect-square rounded-full w-fit h-fit flex items-center justify-center p-5 text-white bg-gray-600'>
                                    <i className="ri-user-fill absolute"></i>
                                </div>
                                <h1 className='font-semibold text-lg text-gray-100'>{user.email}</h1>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Right Section - Code Editor and Preview */}
            <section className="right bg-gradient-to-b from-gray-800 to-gray-900 flex-grow h-full flex">
                {/* Explorer */}
                <div className="explorer h-full max-w-64 min-w-52 bg-gray-900 shadow-lg">
                    <FolderManager 
                        fileTree={fileTree} 
                        onFileTreeChange={(newFileTree) => {
                            setFileTree(newFileTree);
                            saveFileTree(newFileTree);
                        }}
                        onFileSelect={(path) => {
                            setCurrentFile(path);
                            setOpenFiles([...new Set([...openFiles, path])]);
                            // Auto-detect and set language based on file extension
                            const detectedLanguage = executionService.detectLanguageFromFile(path);
                            if (executionService.isLanguageSupported(detectedLanguage)) {
                                setSelectedLanguage(detectedLanguage);
                                executionService.setLanguage(detectedLanguage);
                            }
                        }}
                    />
                </div>

                {/* Code Editor */}
                <div className="code-editor flex flex-col flex-grow h-full shrink">
                    <div className="top flex justify-between w-full bg-gray-900 p-2 shadow-lg">
                        <div className="files flex">
                            {openFiles.map((file, index) => (
                                <div
                                    key={index}
                                    className={`open-file cursor-pointer p-2 px-3 flex items-center w-fit gap-1 bg-gray-800 mx-1 ${currentFile === file ? 'bg-gray-700' : ''} hover:bg-gray-700 rounded-lg transition-colors group`}
                                >
                                    <button
                                        onClick={() => setCurrentFile(file)}
                                        className="flex items-center gap-1 flex-1"
                                    >
                                        <i className="ri-file-line text-gray-400 text-xs"></i>
                                        <p className='font-medium text-sm text-gray-100 truncate'>{file}</p>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const newOpenFiles = openFiles.filter((_, i) => i !== index);
                                            setOpenFiles(newOpenFiles);
                                            if (currentFile === file && newOpenFiles.length > 0) {
                                                setCurrentFile(newOpenFiles[0]);
                                            } else if (newOpenFiles.length === 0) {
                                                setCurrentFile(null);
                                            }
                                        }}
                                        className="ml-1 p-1 text-gray-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                        title="Close tab"
                                    >
                                        <i className="ri-close-line text-xs"></i>
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="actions flex gap-2 justify-end items-center">
                            {/* Container Update Indicator */}
                            {isUpdatingContainers && (
                                <div className="flex items-center gap-2 px-3 py-1 bg-yellow-600 text-white rounded-lg text-sm">
                                    <i className="ri-loader-4-line animate-spin"></i>
                                    <span>Updating containers...</span>
                                </div>
                            )}
                            
                            {/* Execution Tabs */}
                            <div className="flex bg-gray-800 rounded-lg p-1 mr-2">
                                <button
                                    onClick={() => setActiveTab('code')}
                                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                        activeTab === 'code'
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-300 hover:text-white'
                                    }`}
                                >
                                    <i className="ri-code-line mr-1"></i>
                                    Code
                                </button>
                                <button
                                    onClick={() => setActiveTab('docker')}
                                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                        activeTab === 'docker'
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-300 hover:text-white'
                                    }`}
                                >
                                    <i className="ri-docker-line mr-1"></i>
                                    Docker
                                </button>
                            </div>
                            
                            {activeTab === 'code' && (
                                <>
                                    <LanguageSelector
                                        selectedLanguage={selectedLanguage}
                                        onLanguageChange={handleLanguageChange}
                                        className="mr-2"
                                    />
                                    {!isExecutionResultsVisible && (
                                        <button
                                            onClick={() => setIsExecutionResultsVisible(true)}
                                            className="p-2 px-3 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors flex items-center gap-1"
                                            title="Show execution results"
                                        >
                                            <i className="ri-terminal-line text-sm"></i>
                                            <span className="text-xs">Results</span>
                                        </button>
                                    )}
                                    <button
                                        onClick={executeCurrentFile}
                                        disabled={isExecuting}
                                        className={`p-2 px-4 rounded-lg transition-colors flex items-center gap-2 ${
                                            isExecuting 
                                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                        }`}
                                    >
                                        {isExecuting ? (
                                            <>
                                                <i className="ri-loader-4-line animate-spin"></i>
                                                Executing...
                                            </>
                                        ) : (
                                            <>
                                                <i className="ri-play-fill"></i>
                                                Run
                                            </>
                                        )}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="bottom flex flex-grow max-w-full shrink overflow-auto">
                        {activeTab === 'code' ? (
                            fileTree[currentFile] && (
                                <CodeEditor
                                    value={fileTree[currentFile]?.type === 'file' ? fileTree[currentFile].contents : ''}
                                    language={executionService.getLanguageConfig(selectedLanguage)?.monacoLanguage || getFileLanguage(currentFile)}
                                    onChange={handleFileChange}
                                    theme={darkMode ? 'vs-dark' : 'light'}
                                />
                            )
                        ) : (
                            <DockerExecution 
                                projectId={project._id}
                                projectFiles={Object.values(fileTree).filter(item => item.type === 'file')}
                                fileTree={fileTree}
                                onStatusChange={(status, data) => {
                                    console.log('Docker execution status:', status, data);
                                }}
                            />
                        )}
                    </div>
                    
                    {/* Execution Results */}
                    {isExecutionResultsVisible && (
                        <ExecutionResults 
                            result={executionResult}
                            isExecuting={isExecuting}
                            onClose={() => setIsExecutionResultsVisible(false)}
                        />
                    )}
                </div>
            </section>

            {/* Terminal Popup */}
            <div className={`fixed bottom-0 left-0 right-0 bg-gray-900 text-white transition-transform duration-300 ${isTerminalOpen ? 'translate-y-0' : 'translate-y-full'}`}>
                <div className="flex justify-between items-center p-2 bg-gray-800">
                    <h2 className="text-lg font-semibold">Terminal</h2>
                    <button
                        onClick={() => setIsTerminalOpen(false)}
                        className="p-2 text-gray-100 hover:text-blue-400 transition-colors"
                    >
                        <i className="ri-close-fill"></i>
                    </button>
                </div>
                <Terminal logs={terminalLogs} className="h-30 overflow-y-auto" />
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-gray-900 p-4 rounded-lg w-96 max-w-full relative shadow-2xl">
                        <header className='flex justify-between items-center mb-4'>
                            <h2 className='text-xl font-semibold text-gray-100'>Select User</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className='p-2 text-gray-100 hover:text-blue-400 transition-colors'
                            >
                                <i className="ri-close-fill"></i>
                            </button>
                        </header>
                        <div className="users-list flex flex-col gap-2 mb-16 max-h-96 overflow-auto">
                            {users.map((user) => (
                                <div
                                    key={user._id}
                                    onClick={() => handleUserClick(user._id)}
                                    className={`user cursor-pointer hover:bg-gray-700 ${Array.from(selectedUserId).indexOf(user._id) !== -1 ? 'bg-gray-700' : ''} p-2 flex gap-2 items-center rounded-lg transition-colors`}
                                >
                                    <div className='aspect-square rounded-full w-fit h-fit flex items-center justify-center p-5 text-white bg-gray-600'>
                                        <i className="ri-user-fill absolute"></i>
                                    </div>
                                    <h1 className='font-semibold text-lg text-gray-100'>{user.email}</h1>
                                </div>
                            ))}
                        </div>
                        <div className="actions absolute bottom-0 left-0 right-0 p-4 bg-gray-900 border-t border-gray-800">
                            <button
                                onClick={addCollaborators}
                                className='w-full p-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors'
                            >
                                Add Selected Users
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default Project;