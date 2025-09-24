import { executeCode, SUPPORTED_LANGUAGES, getLanguageByExtension } from '../config/judge0';

class ExecutionService {
    constructor() {
        this.currentLanguage = 'javascript';
        this.executionHistory = [];
    }

    // Set the current language for execution
    setLanguage(language) {
        if (SUPPORTED_LANGUAGES[language]) {
            this.currentLanguage = language;
            return true;
        }
        return false;
    }

    // Get current language
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    // Get language configuration
    getLanguageConfig(language = this.currentLanguage) {
        return SUPPORTED_LANGUAGES[language];
    }

    // Execute code with the current language
    async execute(sourceCode, stdin = '') {
        try {
            console.log(`Executing ${this.currentLanguage} code...`);
            
            const result = await executeCode(sourceCode, this.currentLanguage, stdin);
            
            // Add to execution history
            this.executionHistory.push({
                timestamp: new Date(),
                language: this.currentLanguage,
                sourceCode,
                stdin,
                result
            });

            return result;
        } catch (error) {
            console.error('Execution error:', error);
            return {
                success: false,
                output: '',
                error: error.message,
                executionTime: 0,
                memory: 0,
                status: { id: 6, description: 'Error' }
            };
        }
    }

    // Execute code with a specific language
    async executeWithLanguage(sourceCode, language, stdin = '') {
        const originalLanguage = this.currentLanguage;
        this.setLanguage(language);
        const result = await this.execute(sourceCode, stdin);
        this.setLanguage(originalLanguage);
        return result;
    }

    // Get execution history
    getExecutionHistory() {
        return this.executionHistory;
    }

    // Clear execution history
    clearExecutionHistory() {
        this.executionHistory = [];
    }

    // Get template code for a language
    getTemplate(language = this.currentLanguage) {
        const config = SUPPORTED_LANGUAGES[language];
        return config ? config.template : '';
    }

    // Detect language from file extension
    detectLanguageFromFile(filename) {
        const extension = filename.split('.').pop();
        return getLanguageByExtension(extension);
    }

    // Get supported languages
    getSupportedLanguages() {
        return Object.keys(SUPPORTED_LANGUAGES);
    }

    // Check if language is supported
    isLanguageSupported(language) {
        return !!SUPPORTED_LANGUAGES[language];
    }
}

// Create singleton instance
const executionService = new ExecutionService();
export default executionService; 