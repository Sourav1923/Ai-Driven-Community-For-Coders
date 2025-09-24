import React from 'react';

const ExecutionResults = ({ result, isExecuting, onClose }) => {
    if (!result && !isExecuting) {
        return null;
    }

    return (
        <div className="execution-results bg-gray-900 border-t border-gray-700 p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-gray-100 font-semibold">Execution Results</h3>
                <div className="flex items-center gap-2">
                    {result && (
                        <div className="flex items-center gap-2 text-sm">
                            <span className={`px-2 py-1 rounded ${
                                result.success 
                                    ? 'bg-green-600 text-white' 
                                    : 'bg-red-600 text-white'
                            }`}>
                                {result.success ? 'Success' : 'Failed'}
                            </span>
                            {result.executionTime && (
                                <span className="text-gray-400">
                                    {result.executionTime}ms
                                </span>
                            )}
                            {result.memory && (
                                <span className="text-gray-400">
                                    {result.memory}KB
                                </span>
                            )}
                        </div>
                    )}
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                        title="Close execution results"
                    >
                        <i className="ri-close-line text-sm"></i>
                    </button>
                </div>
            </div>

            {isExecuting && (
                <div className="flex items-center gap-2 text-blue-400">
                    <i className="ri-loader-4-line animate-spin"></i>
                    <span>Executing code...</span>
                </div>
            )}

            {result && (
                <div className="space-y-3">
                    {result.output && (
                        <div>
                            <h4 className="text-gray-300 text-sm font-medium mb-1">Output:</h4>
                            <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
                                {result.output}
                            </pre>
                        </div>
                    )}

                    {result.error && (
                        <div>
                            <h4 className="text-gray-300 text-sm font-medium mb-1">Error:</h4>
                            <pre className="bg-gray-800 text-red-400 p-3 rounded text-sm overflow-x-auto">
                                {result.error}
                            </pre>
                        </div>
                    )}

                    {result.status && (
                        <div>
                            <h4 className="text-gray-300 text-sm font-medium mb-1">Status:</h4>
                            <div className="bg-gray-800 p-3 rounded text-sm">
                                <span className="text-gray-400">ID: {result.status.id}</span>
                                <br />
                                <span className="text-gray-300">{result.status.description}</span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ExecutionResults; 