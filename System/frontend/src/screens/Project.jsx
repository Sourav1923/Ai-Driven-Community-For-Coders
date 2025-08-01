import React, { useState, useEffect, useContext, useRef } from 'react';
import { UserContext } from '../context/user.context';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../config/axios';
import { initializeSocket, receiveMessage, sendMessage } from '../config/socket';
import Markdown from 'markdown-to-jsx';
import hljs from 'highlight.js';
import { getWebContainer } from '../config/webcontainer';
import Terminal from './Terminal'; // Import the Terminal component

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
    const [users, setUsers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [fileTree, setFileTree] = useState({});
    const [currentFile, setCurrentFile] = useState(null);
    const [openFiles, setOpenFiles] = useState([]);
    const [webContainer, setWebContainer] = useState(null);
    const [iframeUrl, setIframeUrl] = useState(null);
    const [runProcess, setRunProcess] = useState(null);
    const [darkMode, setDarkMode] = useState(true);
    const [terminalLogs, setTerminalLogs] = useState([]); // State for terminal logs
    const [isTerminalOpen, setIsTerminalOpen] = useState(false); // State to toggle terminal visibility

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
        sendMessage('project-message', {
            message,
            sender: user,
        });
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
        if (!webContainer) {
            getWebContainer().then((container) => {
                setWebContainer(container);
                console.log('container started');
            });
        }

        receiveMessage('project-message', (data) => {
            if (data.sender._id == 'ai') {
                const message = JSON.parse(data.message);
                webContainer?.mount(message.fileTree);
                if (message.fileTree) {
                    setFileTree(message.fileTree || {});
                }
                setMessages((prevMessages) => [...prevMessages, data]);
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
    }, []);

    function saveFileTree(ft) {
        axios
            .put('/projects/update-file-tree', {
                projectId: project._id,
                fileTree: ft,
            })
            .then((res) => {
                console.log(res.data);
            })
            .catch((err) => {
                console.log(err);
            });
    }

    function scrollToBottom() {
        messageBox.current.scrollTop = messageBox.current.scrollHeight;
    }

    function sendToNext(event){
        if(event.key==='Enter'){
            send();
        }
    }

    

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
                    <button
                        onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
                        className='p-2 text-gray-100 hover:text-blue-400 transition-colors'
                    >
                        <i className="ri-group-fill"></i>
                    </button>
                </header>

                {/* Conversation Area */}
                <div className="conversation-area pt-14 pb-10 flex-grow flex flex-col h-full relative">
                    <div
                        ref={messageBox}
                        className="message-box p-1 flex-grow flex flex-col gap-2 overflow-auto max-h-full scrollbar-hide"
                    >
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`${msg.sender._id === 'ai' ? 'max-w-80' : 'max-w-52'} ${msg.sender._id == user._id.toString() && 'ml-auto'} message flex flex-col p-2 bg-gray-700 rounded-lg shadow-md`}
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
                    <div className="inputField w-full flex absolute bottom-0 bg-gray-800 p-2">
                        <input
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className='p-2 px-4 border-none outline-none flex-grow bg-gray-700 text-gray-100 placeholder-gray-400 rounded-l-lg'
                            type="text"
                            placeholder='Enter message'
                            onKeyDown={sendToNext}
                            
                        />
                        <button
                            onClick={send}
                            className='px-5 bg-blue-600 text-white hover:bg-blue-700 rounded-r-lg transition-colors'
                        >
                            <i className="ri-send-plane-fill"></i>
                        </button>
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
                    <div className="file-tree w-full p-2 space-y-2">
                        {Object.keys(fileTree).map((file, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    setCurrentFile(file);
                                    setOpenFiles([...new Set([...openFiles, file])]);
                                }}
                                className="tree-element cursor-pointer p-2 px-4 flex items-center gap-2 bg-gray-800 w-full hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <p className='font-semibold text-lg text-gray-100'>{file}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Code Editor */}
                <div className="code-editor flex flex-col flex-grow h-full shrink">
                    <div className="top flex justify-between w-full bg-gray-900 p-2 shadow-lg">
                        <div className="files flex">
                            {openFiles.map((file, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentFile(file)}
                                    className={`open-file cursor-pointer p-2 px-4 flex items-center w-fit gap-2 bg-gray-800 mx-1 ${currentFile === file ? 'bg-gray-700' : ''} hover:bg-gray-700 rounded-lg transition-colors`}
                                >
                                    <p className='font-semibold text-lg text-gray-100'>{file}</p>
                                </button>
                            ))}
                        </div>

                        <div className="actions flex gap-2 justify-end">
                            <a href="http://localhost:3002/" className='p-2 px-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors'>Code Review</a>
                            <button
                                onClick={async () => {
                                    setIsTerminalOpen(true); // Open the terminal
                                    setTerminalLogs([]); // Clear previous logs
                                    await webContainer.mount(fileTree);
                                    const installProcess = await webContainer.spawn("npm", ["install"]);
                                    installProcess.output.pipeTo(
                                        new WritableStream({
                                            write(chunk) {
                                                setTerminalLogs((prevLogs) => [...prevLogs, chunk]);
                                            },
                                        })
                                    );
                                    if (runProcess) {
                                        runProcess.kill();
                                    }
                                    let tempRunProcess = await webContainer.spawn("npm", ["start"]);
                                    tempRunProcess.output.pipeTo(
                                        new WritableStream({
                                            write(chunk) {
                                                setTerminalLogs((prevLogs) => [...prevLogs, chunk]);
                                            },
                                        })
                                    );
                                    setRunProcess(tempRunProcess);
                                    webContainer.on('server-ready', (port, url) => {
                                        setTerminalLogs((prevLogs) => [...prevLogs, `Server ready on port ${port}`]);
                                        setTerminalLogs((prevLogs) => [...prevLogs, `URL: ${url}`]);
                                        setIframeUrl(url);
                                    });
                                }}
                                className='p-2 px-4 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors'
                            >
                                Run
                            </button>
                        </div>
                    </div>
                    <div className="bottom flex flex-grow max-w-full shrink overflow-auto">
                        {fileTree[currentFile] && (
                            <div className="code-editor-area h-full overflow-auto flex-grow bg-gray-900">
                                <pre className="hljs h-full">
                                    <code
                                        className="hljs h-full outline-none text-gray-100"
                                        contentEditable
                                        suppressContentEditableWarning
                                        onBlur={(e) => {
                                            const updatedContent = e.target.innerText;
                                            const ft = {
                                                ...fileTree,
                                                [currentFile]: {
                                                    file: {
                                                        contents: updatedContent,
                                                    },
                                                },
                                            };
                                            setFileTree(ft);
                                            saveFileTree(ft);
                                        }}
                                        dangerouslySetInnerHTML={{ __html: hljs.highlight('javascript', fileTree[currentFile].file.contents).value }}
                                        style={{
                                            whiteSpace: 'pre-wrap',
                                            paddingBottom: '25rem',
                                            counterSet: 'line-numbering',
                                        }}
                                    />
                                </pre>
                            </div>
                        )}
                    </div>
                </div>

                {/* Iframe Section */}
                {iframeUrl && webContainer && (
                    <div className="flex min-w-96 flex-col h-full bg-white shadow-lg text-white">
                        <div className="address-bar p-2 bg-white text-white">
                            <input
                                type="text"
                                onChange={(e) => setIframeUrl(e.target.value)}
                                value={iframeUrl}
                                className="w-full p-2 px-4 bg-gray-700 text-gray-100 rounded-lg"
                            />
                        </div>
                        <iframe src={iframeUrl} className="w-full h-full"></iframe>
                    </div>
                )}
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
                                    className={`user cursor-pointer hover:bg-gray-700 ${Array.from(selectedUserId).indexOf(user._id) != -1 ? 'bg-gray-700' : ''} p-2 flex gap-2 items-center rounded-lg transition-colors`}
                                    onClick={() => handleUserClick(user._id)}
                                >
                                    <div className='aspect-square relative rounded-full w-fit h-fit flex items-center justify-center p-5 text-white bg-gray-600'>
                                        <i className="ri-user-fill absolute"></i>
                                    </div>
                                    <h1 className='font-semibold text-lg text-gray-100'>{user.email}</h1>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={addCollaborators}
                            className='absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                        >
                            Add Collaborators
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
};

export default Project;