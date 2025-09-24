import React from 'react';
import { SUPPORTED_LANGUAGES } from '../config/judge0';

const LanguageSelector = ({ selectedLanguage, onLanguageChange, className = '' }) => {
    return (
        <div className={`language-selector ${className}`}>
            <select
                value={selectedLanguage}
                onChange={(e) => onLanguageChange(e.target.value)}
                className="bg-gray-800 text-gray-100 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
            >
                {Object.entries(SUPPORTED_LANGUAGES).map(([key, language]) => (
                    <option key={key} value={key} className="bg-gray-800 text-gray-100">
                        {language.name}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default LanguageSelector; 