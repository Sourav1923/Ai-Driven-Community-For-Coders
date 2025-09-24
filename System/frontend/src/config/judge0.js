// Judge0 API Configuration
const JUDGE0_API_URL = 'https://judge0-ce.p.rapidapi.com';
const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY || 'demo-key';

// Check if API key is properly configured
const isApiKeyConfigured = () => {
    return RAPIDAPI_KEY && RAPIDAPI_KEY !== 'demo-key' && RAPIDAPI_KEY !== 'your-rapidapi-key-here';
};

// Language configurations with Judge0 language IDs
export const SUPPORTED_LANGUAGES = {
    'javascript': {
        id: 63, // Node.js
        name: 'JavaScript',
        extension: '.js',
        monacoLanguage: 'javascript',
        template: `console.log("Hello, World!");`
    },
    'python': {
        id: 71, // Python 3
        name: 'Python',
        extension: '.py',
        monacoLanguage: 'python',
        template: `print("Hello, World!")`
    },
    'java': {
        id: 62, // Java
        name: 'Java',
        extension: '.java',
        monacoLanguage: 'java',
        template: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`
    },
    'cpp': {
        id: 54, // C++ (GCC 9.2.0)
        name: 'C++',
        extension: '.cpp',
        monacoLanguage: 'cpp',
        template: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`
    },
    'c': {
        id: 50, // C (GCC 9.2.0)
        name: 'C',
        extension: '.c',
        monacoLanguage: 'c',
        template: `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}`
    }
};

// Get language by file extension
export const getLanguageByExtension = (extension) => {
    const ext = extension.toLowerCase().replace('.', '');
    const languageMap = {
        'js': 'javascript',
        'jsx': 'javascript',
        'ts': 'typescript',
        'tsx': 'typescript',
        'py': 'python',
        'java': 'java',
        'cpp': 'cpp',
        'c': 'c',
        'html': 'html',
        'css': 'css',
        'json': 'json',
        'md': 'markdown'
    };
    return languageMap[ext] || 'javascript';
};

// Submit code to Judge0 API
export const submitCode = async (sourceCode, languageId, stdin = '') => {
    try {
        const response = await fetch(`${JUDGE0_API_URL}/submissions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-RapidAPI-Key': RAPIDAPI_KEY,
                'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
            },
            body: JSON.stringify({
                source_code: sourceCode,
                language_id: languageId,
                stdin: stdin
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.token;
    } catch (error) {
        console.error('Error submitting code:', error);
        throw error;
    }
};

// Get submission result
export const getSubmissionResult = async (token) => {
    try {
        const response = await fetch(`${JUDGE0_API_URL}/submissions/${token}`, {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': RAPIDAPI_KEY,
                'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error getting submission result:', error);
        throw error;
    }
};

// Poll for submission result
export const pollSubmissionResult = async (token, maxAttempts = 30) => {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
        try {
            const result = await getSubmissionResult(token);
            
            if (result.status && result.status.id > 2) {
                // Status > 2 means processing is complete
                return result;
            }
            
            // Wait 1 second before next poll
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;
        } catch (error) {
            console.error('Error polling submission result:', error);
            attempts++;
        }
    }
    
    throw new Error('Timeout waiting for submission result');
};

// Execute code with Judge0
export const executeCode = async (sourceCode, language, stdin = '') => {
    try {
        // Check if API key is configured
        if (!isApiKeyConfigured()) {
            return {
                success: false,
                output: '',
                error: 'API key not configured. Please set VITE_RAPIDAPI_KEY in your .env file.',
                executionTime: 0,
                memory: 0,
                status: { id: 6, description: 'API Key Not Configured' }
            };
        }

        const languageConfig = SUPPORTED_LANGUAGES[language];
        if (!languageConfig) {
            throw new Error(`Unsupported language: ${language}`);
        }

        // Submit code
        const token = await submitCode(sourceCode, languageConfig.id, stdin);
        
        // Poll for result
        const result = await pollSubmissionResult(token);
        
        return {
            success: result.status.id === 3, // 3 = Accepted
            output: result.stdout || '',
            error: result.stderr || '',
            executionTime: result.time,
            memory: result.memory,
            status: result.status
        };
    } catch (error) {
        console.error('Error executing code:', error);
        return {
            success: false,
            output: '',
            error: error.message,
            executionTime: 0,
            memory: 0,
            status: { id: 6, description: 'Error' } // 6 = Error
        };
    }
}; 