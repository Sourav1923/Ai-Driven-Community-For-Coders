import React from 'react';
import Editor from '@monaco-editor/react';

const CodeEditor = ({ value, language, onChange, theme }) => {
    const handleEditorDidMount = (editor, monaco) => {
        // Enable format on Ctrl+F
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => {
            editor.getAction('editor.action.formatDocument').run();
        });
    };

    return (
        <Editor
            height="100%"
            width="100%"
            language={language}
            value={value}
            theme={theme}
            onChange={onChange}
            onMount={handleEditorDidMount}
            options={{
                automaticLayout: true,
                wordWrap: 'on',
                lineNumbers: 'on',
                bracketPairColorization: {
                    enabled: true
                },
                minimap: {
                    enabled: true
                },
                scrollBeyondLastLine: false,
                fontSize: 14,
                fontFamily: 'monospace',
                tabSize: 2
            }}
        />
    );
};

export default CodeEditor;