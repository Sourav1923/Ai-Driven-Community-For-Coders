import React, { useEffect, useRef } from 'react';

const Terminal = ({ logs }) => {
    const terminalRef = useRef(null);

    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="terminal bg-black text-green-400 font-mono text-sm p-4 h-64 overflow-y-auto rounded-lg">
            <div ref={terminalRef}>
                {logs.map((log, index) => (
                    <div key={index} className="log">
                        {log}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Terminal;