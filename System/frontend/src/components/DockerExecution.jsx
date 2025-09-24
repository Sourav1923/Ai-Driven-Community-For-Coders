import React, { useState, useEffect, useRef } from 'react';
import dockerExecutionService from '../services/docker.service';
import { Play, Square, RotateCcw, Eye, FileText, Upload, Download } from 'lucide-react';

const DockerExecution = ({ projectId, projectFiles, fileTree, onStatusChange }) => {
    const [containers, setContainers] = useState([]);
    const [selectedProjectType, setSelectedProjectType] = useState('nodejs');
    const [projectTypes, setProjectTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [showLogs, setShowLogs] = useState(false);
    const [selectedContainer, setSelectedContainer] = useState(null);
    const [logs, setLogs] = useState('');
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        loadProjectTypes();
        loadActiveContainers();
        
        // Poll for container updates every 10 seconds
        const interval = setInterval(loadActiveContainers, 10000);
        return () => clearInterval(interval);
    }, []);

    const loadProjectTypes = async () => {
        try {
            const result = await dockerExecutionService.getSupportedProjectTypes();
            if (result.success) {
                setProjectTypes(result.data);
            }
        } catch (error) {
            console.error('Error loading project types:', error);
        }
    };

    const loadActiveContainers = async () => {
        try {
            const result = await dockerExecutionService.getActiveContainers();
            if (result.success) {
                setContainers(result.data);
            }
        } catch (error) {
            console.error('Error loading containers:', error);
        }
    };

    const handleRunProject = async () => {
        // Check if we have file tree or project files
        const hasFileTree = fileTree && Object.keys(fileTree).length > 0;
        const hasProjectFiles = projectFiles && projectFiles.length > 0;

        if (!hasFileTree && !hasProjectFiles) {
            setError('Please create some files in the project or upload files to run');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            let result;
            
            if (hasFileTree) {
                // Run from file tree (preferred method)
                result = await dockerExecutionService.runProjectFromTree(
                    projectId,
                    fileTree,
                    selectedProjectType
                );
            } else {
                // Fallback to file upload method
                result = await dockerExecutionService.runProject(
                    projectId,
                    projectFiles,
                    selectedProjectType
                );
            }

            if (result.success) {
                setSuccess(`Project started successfully! Preview URL: ${result.data.previewUrl}`);
                await loadActiveContainers();
                if (onStatusChange) {
                    onStatusChange('running', result.data);
                }
            } else {
                setError(result.error || 'Failed to start project');
            }
        } catch (error) {
            console.error('Docker execution error:', error);
            setError(error.message || 'Failed to start project');
        } finally {
            setLoading(false);
        }
    };

    const handleStopProject = async (containerId) => {
        setLoading(true);
        setError(null);

        try {
            const result = await dockerExecutionService.stopProject(containerId);
            if (result.success) {
                setSuccess('Project stopped successfully');
                await loadActiveContainers();
                if (onStatusChange) {
                    onStatusChange('stopped', { containerId });
                }
            } else {
                setError(result.error || 'Failed to stop project');
            }
        } catch (error) {
            setError(error.message || 'Failed to stop project');
        } finally {
            setLoading(false);
        }
    };

    const handleRestartProject = async (containerId) => {
        setLoading(true);
        setError(null);

        try {
            const result = await dockerExecutionService.restartContainer(containerId);
            if (result.success) {
                setSuccess('Project restarted successfully');
                await loadActiveContainers();
            } else {
                setError(result.error || 'Failed to restart project');
            }
        } catch (error) {
            setError(error.message || 'Failed to restart project');
        } finally {
            setLoading(false);
        }
    };

    const handleViewLogs = async (containerId) => {
        try {
            const result = await dockerExecutionService.getContainerLogs(containerId);
            if (result.success) {
                setLogs(result.data.logs);
                setSelectedContainer(containerId);
                setShowLogs(true);
            }
        } catch (error) {
            setError(error.message || 'Failed to get logs');
        }
    };

    const handleFileUpload = (event) => {
        const files = Array.from(event.target.files);
        if (files.length > 0) {
            // Update project files (this would need to be passed up to parent component)
            console.log('Files selected:', files);
        }
    };

    const handleDownloadProject = (containerId) => {
        // Implementation for downloading project files
        console.log('Download project:', containerId);
    };

    const getStatusBadge = (status) => {
        const variants = {
            running: 'bg-green-600 text-white',
            stopped: 'bg-gray-600 text-white',
            exited: 'bg-red-600 text-white',
            error: 'bg-red-600 text-white',
            starting: 'bg-yellow-600 text-white'
        };
        return (
            <span className={`text-xs px-2 py-1 rounded ${variants[status] || 'bg-gray-600 text-white'}`}>
                {status}
            </span>
        );
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    return (
        <div className="docker-execution p-4">
            <div className="bg-gray-800 rounded-lg mb-4">
                <div className="bg-gray-700 px-4 py-3 rounded-t-lg">
                    <h5 className="mb-0 text-white flex items-center">
                        <Play size={20} className="mr-2" />
                        Docker Execution Engine
                    </h5>
                </div>
                <div className="p-4">
                    {error && (
                        <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded mb-4 flex justify-between items-center">
                            <span>{error}</span>
                            <button 
                                onClick={() => setError(null)}
                                className="text-red-300 hover:text-red-100"
                            >
                                ×
                            </button>
                        </div>
                    )}
                    
                    {success && (
                        <div className="bg-green-900 border border-green-700 text-green-200 px-4 py-3 rounded mb-4 flex justify-between items-center">
                            <span>{success}</span>
                            <button 
                                onClick={() => setSuccess(null)}
                                className="text-green-300 hover:text-green-100"
                            >
                                ×
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Project Type
                            </label>
                            <select
                                value={selectedProjectType}
                                onChange={(e) => setSelectedProjectType(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                            >
                                {projectTypes.map(type => (
                                    <option key={type.id} value={type.id}>
                                        {type.name} - {type.description}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Execution Method
                            </label>
                            <div className="bg-gray-700 border border-gray-600 text-white rounded px-3 py-2">
                                {fileTree && Object.keys(fileTree).length > 0 ? (
                                    <div className="flex items-center gap-2 text-green-400">
                                        <i className="ri-folder-line"></i>
                                        <span>Running from File Tree ({Object.keys(fileTree).length} files)</span>
                                    </div>
                                ) : projectFiles && projectFiles.length > 0 ? (
                                    <div className="flex items-center gap-2 text-blue-400">
                                        <i className="ri-upload-line"></i>
                                        <span>Running from Uploaded Files</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <i className="ri-error-warning-line"></i>
                                        <span>No files available</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-end gap-2">
                            <button
                                onClick={handleRunProject}
                                disabled={loading || (!fileTree && !projectFiles)}
                                className={`px-4 py-2 rounded flex items-center gap-2 ${
                                    loading || (!fileTree && !projectFiles)
                                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Starting...
                                    </>
                                ) : (
                                    <>
                                        <Play size={16} />
                                        {fileTree && Object.keys(fileTree).length > 0 ? 'Run from Files' : 'Run Project'}
                                    </>
                                )}
                            </button>
                            
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="px-4 py-2 border border-gray-600 text-gray-300 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <Upload size={16} />
                                Upload Files
                            </button>
                            
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Active Containers */}
            <div className="bg-gray-800 rounded-lg">
                <div className="bg-gray-700 px-4 py-3 rounded-t-lg">
                    <h6 className="mb-0 text-white">Active Containers</h6>
                </div>
                <div className="p-4">
                    {containers.length === 0 ? (
                        <p className="text-gray-400">No active containers</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-300">
                                <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                                    <tr>
                                        <th className="px-4 py-3">Container ID</th>
                                        <th className="px-4 py-3">Project Type</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Preview URL</th>
                                        <th className="px-4 py-3">Created</th>
                                        <th className="px-4 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {containers.map(container => (
                                        <tr key={container.containerId} className="border-b border-gray-700 hover:bg-gray-700">
                                            <td className="px-4 py-3">
                                                <code className="bg-gray-600 px-2 py-1 rounded text-xs">
                                                    {container.containerId.slice(0, 8)}...
                                                </code>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">
                                                    {container.projectType}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {getStatusBadge(container.status)}
                                            </td>
                                            <td className="px-4 py-3">
                                                {container.previewUrl ? (
                                                    <a 
                                                        href={container.previewUrl} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                                    >
                                                        <Eye size={16} />
                                                        Open Preview
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-500">Not available</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {formatDate(container.createdAt)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => handleViewLogs(container.containerId)}
                                                        title="View Logs"
                                                        className="p-2 border border-blue-600 text-blue-400 rounded hover:bg-blue-600 hover:text-white transition-colors"
                                                    >
                                                        <FileText size={14} />
                                                    </button>
                                                    
                                                    <button
                                                        onClick={() => handleRestartProject(container.containerId)}
                                                        title="Restart"
                                                        className="p-2 border border-yellow-600 text-yellow-400 rounded hover:bg-yellow-600 hover:text-white transition-colors"
                                                    >
                                                        <RotateCcw size={14} />
                                                    </button>
                                                    
                                                    <button
                                                        onClick={() => handleStopProject(container.containerId)}
                                                        title="Stop"
                                                        className="p-2 border border-red-600 text-red-400 rounded hover:bg-red-600 hover:text-white transition-colors"
                                                    >
                                                        <Square size={14} />
                                                    </button>
                                                    
                                                    <button
                                                        onClick={() => handleDownloadProject(container.containerId)}
                                                        title="Download"
                                                        className="p-2 border border-gray-600 text-gray-400 rounded hover:bg-gray-600 hover:text-white transition-colors"
                                                    >
                                                        <Download size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Logs Modal */}
            {showLogs && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[80vh] flex flex-col">
                        <div className="bg-gray-700 px-4 py-3 rounded-t-lg flex justify-between items-center">
                            <h5 className="text-white mb-0">Container Logs</h5>
                            <button 
                                onClick={() => setShowLogs(false)}
                                className="text-gray-300 hover:text-white"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-4 flex-1 overflow-auto">
                            <pre className="bg-gray-900 text-gray-200 p-4 rounded text-sm" style={{ maxHeight: '400px', overflow: 'auto' }}>
                                {logs || 'No logs available'}
                            </pre>
                        </div>
                        <div className="bg-gray-700 px-4 py-3 rounded-b-lg flex justify-end">
                            <button 
                                onClick={() => setShowLogs(false)}
                                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DockerExecution; 