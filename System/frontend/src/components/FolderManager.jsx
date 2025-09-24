import React, { useState } from 'react';

const FolderManager = ({ fileTree, onFileTreeChange, onFileSelect }) => {
    const [newItemName, setNewItemName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [creationType, setCreationType] = useState('folder'); // 'folder' or 'file'
    const [currentPath, setCurrentPath] = useState('');
    const [expandedFolders, setExpandedFolders] = useState(new Set());
    const [selectedFolder, setSelectedFolder] = useState(''); // Track the currently selected folder

    const createItem = () => {
        if (!newItemName.trim()) return;
        
        // Sanitize the new item name to prevent path traversal
        const sanitizedName = newItemName.trim().replace(/[\/\\]/g, '');
        
        // Construct the full path relative to selected directory
        const fullPath = selectedFolder ? `${selectedFolder}/${sanitizedName}` : sanitizedName;
        
        // Check if item already exists in current directory
        const itemExists = Object.keys(fileTree).some(path => {
            const parentDir = path.split('/').slice(0, -1).join('/');
            return parentDir === selectedFolder && path.split('/').pop() === sanitizedName;
        });
        
        if (itemExists) {
            alert(`An item named "${sanitizedName}" already exists in this folder!`);
            return;
        }

        const newItem = {
            [fullPath]: creationType === 'folder' ? {
                type: 'directory',
                children: {}
            } : {
                type: 'file',
                contents: ''
            }
        };

        onFileTreeChange({
            ...fileTree,
            ...newItem
        });

        setNewItemName('');
        setIsCreating(false);
    };

    const deleteItem = (path) => {
        // Confirm deletion
        const itemName = path.split('/').pop();
        const isDirectory = fileTree[path]?.type === 'directory';
        
        if (!confirm(`Are you sure you want to delete ${isDirectory ? 'folder' : 'file'} "${itemName}"?`)) {
            return;
        }

        // Create a new file tree without the deleted item and its children
        const newFileTree = { ...fileTree };
        
        // Remove the item and all its children (if it's a directory)
        Object.keys(newFileTree).forEach(key => {
            if (key === path || key.startsWith(path + '/')) {
                delete newFileTree[key];
            }
        });

        onFileTreeChange(newFileTree);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            createItem();
        } else if (e.key === 'Escape') {
            setIsCreating(false);
            setNewItemName('');
        }
    };

    const toggleFolder = (folderPath) => {
        const newExpanded = new Set(expandedFolders);
        if (newExpanded.has(folderPath)) {
            newExpanded.delete(folderPath);
        } else {
            newExpanded.add(folderPath);
        }
        setExpandedFolders(newExpanded);
        
        // Set the selected folder for file creation context
        setSelectedFolder(folderPath);
    };

    const getFileIcon = (fileName) => {
        const ext = fileName.split('.').pop().toLowerCase();
        const iconMap = {
            'js': 'ri-file-code-line',
            'jsx': 'ri-file-code-line',
            'ts': 'ri-file-code-line',
            'tsx': 'ri-file-code-line',
            'html': 'ri-file-code-line',
            'css': 'ri-file-code-line',
            'json': 'ri-file-code-line',
            'md': 'ri-file-text-line',
            'txt': 'ri-file-text-line',
            'png': 'ri-file-image-line',
            'jpg': 'ri-file-image-line',
            'jpeg': 'ri-file-image-line',
            'gif': 'ri-file-image-line',
            'svg': 'ri-file-image-line',
            'pdf': 'ri-file-pdf-line',
            'zip': 'ri-file-zip-line',
            'rar': 'ri-file-zip-line',
            'py': 'ri-file-code-line',
            'java': 'ri-file-code-line',
            'cpp': 'ri-file-code-line',
            'c': 'ri-file-code-line',
            'php': 'ri-file-code-line',
            'rb': 'ri-file-code-line',
            'go': 'ri-file-code-line',
            'rs': 'ri-file-code-line',
            'sql': 'ri-file-code-line',
            'xml': 'ri-file-code-line',
            'yml': 'ri-file-code-line',
            'yaml': 'ri-file-code-line',
            'env': 'ri-file-code-line',
            'gitignore': 'ri-file-code-line',
            'dockerfile': 'ri-file-code-line',
            'readme': 'ri-file-text-line'
        };
        return iconMap[ext] || 'ri-file-line';
    };

    const renderFileTree = (items, level = 0) => {
        return items.map(([path, item]) => {
            const name = path.split('/').pop();
            const isDirectory = item.type === 'directory';
            const isExpanded = expandedFolders.has(path);
            const hasChildren = isDirectory && Object.keys(fileTree).some(p => 
                p.startsWith(path + '/') && p.split('/').length === path.split('/').length + 1
            );

            return (
                <div key={path} style={{ marginLeft: `${level * 16}px` }}>
                    <div
                        onClick={() => {
                            if (isDirectory) {
                                toggleFolder(path);
                                setSelectedFolder(path);
                            } else {
                                onFileSelect(path);
                            }
                        }}
                        className={`flex items-center gap-1 py-1 px-2 rounded cursor-pointer group relative ${
                            selectedFolder === path ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'
                        }`}
                    >
                        {isDirectory ? (
                            <i 
                                className={`ri-arrow-right-s-line text-gray-400 transition-transform ${
                                    isExpanded ? 'rotate-90' : ''
                                }`}
                                style={{ fontSize: '14px' }}
                            ></i>
                        ) : (
                            <div className="w-3"></div>
                        )}
                        <i 
                            className={`${
                                isDirectory 
                                    ? 'ri-folder-line text-blue-400' 
                                    : getFileIcon(name) + ' text-gray-400'
                            } group-hover:text-gray-200 transition-colors`}
                            style={{ fontSize: '16px' }}
                        ></i>
                        <span className={`text-sm transition-colors truncate flex-1 ${
                            selectedFolder === path ? 'text-white' : 'text-gray-300 group-hover:text-gray-100'
                        }`}>
                            {name}
                        </span>
                        
                        {/* Delete icon - appears on hover */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                deleteItem(path);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded"
                            title={`Delete ${isDirectory ? 'folder' : 'file'}`}
                        >
                            <i className="ri-delete-bin-line" style={{ fontSize: '14px' }}></i>
                        </button>
                    </div>
                    
                    {isDirectory && isExpanded && hasChildren && (
                        <div className="ml-2">
                            {renderFileTree(
                                Object.entries(fileTree).filter(([p]) => 
                                    p.startsWith(path + '/') && 
                                    p.split('/').length === path.split('/').length + 1
                                ),
                                level + 1
                            )}
                        </div>
                    )}
                </div>
            );
        });
    };

    const getRootItems = () => {
        return Object.entries(fileTree).filter(([path]) => !path.includes('/'));
    };

    return (
        <div className="folder-manager w-full h-full flex flex-col bg-gray-900 border-r border-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-800">
                <div className="flex flex-col">
                    <h2 className="text-gray-100 font-medium text-sm">EXPLORER</h2>
                    {selectedFolder && (
                        <div className="text-xs text-gray-400 truncate">
                            Context: {selectedFolder}
                        </div>
                    )}
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={() => {
                            setCreationType('file');
                            setIsCreating(true);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-100 hover:bg-gray-700 rounded transition-colors"
                        title="New File"
                    >
                        <i className="ri-file-add-line" style={{ fontSize: '14px' }}></i>
                    </button>
                    <button
                        onClick={() => {
                            setCreationType('folder');
                            setIsCreating(true);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-100 hover:bg-gray-700 rounded transition-colors"
                        title="New Folder"
                    >
                        <i className="ri-folder-add-line" style={{ fontSize: '14px' }}></i>
                    </button>
                </div>
            </div>

            {/* Create new item input */}
            {isCreating && (
                <div className="p-3 border-b border-gray-700 bg-gray-800">
                    <div className="text-xs text-gray-400 mb-2">
                        Creating in: {selectedFolder || 'Root'}
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                        <i className={`${creationType === 'folder' ? 'ri-folder-line text-blue-400' : 'ri-file-line text-gray-400'} flex-shrink-0`}></i>
                        <input
                            type="text"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder={`${creationType === 'folder' ? 'Folder' : 'File'} name`}
                            className="flex-grow bg-transparent border-none outline-none text-gray-100 text-sm placeholder-gray-500 min-w-0"
                            autoFocus
                        />
                        <div className="flex gap-1 flex-shrink-0">
                            <button
                                onClick={createItem}
                                className="px-3 py-1 text-xs bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors font-medium whitespace-nowrap"
                            >
                                Create
                            </button>
                            <button
                                onClick={() => {
                                    setIsCreating(false);
                                    setNewItemName('');
                                }}
                                className="px-3 py-1 text-xs bg-gray-600 text-white hover:bg-gray-700 rounded transition-colors font-medium whitespace-nowrap"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* File Tree */}
            <div className="flex-1 overflow-y-auto p-2">
                {/* Root folder selector */}
                <div 
                    onClick={() => setSelectedFolder('')}
                    className={`flex items-center gap-1 py-1 px-2 rounded cursor-pointer mb-2 ${
                        selectedFolder === '' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                    }`}
                >
                    <i className="ri-home-line" style={{ fontSize: '14px' }}></i>
                    <span className="text-sm">Root</span>
                </div>
                
                <div className="file-tree">
                    {renderFileTree(getRootItems())}
                </div>
            </div>
        </div>
    );
};

export default FolderManager;