# Judge0 API Setup Guide

## Overview
This application now uses Judge0 API for multi-language code execution instead of WebContainer. This provides better scalability and support for multiple programming languages.

## Supported Languages
- JavaScript (Node.js)
- Python 3
- Java
- C++
- C

## Setup Instructions

### 1. Get RapidAPI Key
1. Go to [RapidAPI Judge0 CE](https://rapidapi.com/judge0-official/api/judge0-ce/)
2. Sign up for a free account
3. Subscribe to the Judge0 CE API (free tier available)
4. Copy your API key

### 2. Configure Environment Variables
Create a `.env` file in the frontend directory:

```env
# Judge0 API Configuration
VITE_RAPIDAPI_KEY=your-rapidapi-key-here
```

### 3. Features

#### Language Selector
- Dynamic dropdown to select programming language
- Auto-detects language based on file extension
- Updates code editor syntax highlighting

#### Code Execution
- Execute code with selected language
- Real-time execution status
- Detailed output and error display
- Execution time and memory usage tracking

#### Execution Results
- Success/failure status
- Program output display
- Error messages
- Execution metrics

### 4. Self-Hosted Piston API (Optional)
For better scalability, you can switch to a self-hosted Piston API:

1. Deploy Piston API on your server
2. Update the API URL in `frontend/src/config/judge0.js`:
   ```javascript
   const JUDGE0_API_URL = 'http://your-piston-server:2000';
   ```

### 5. Usage
1. Select a programming language from the dropdown
2. Write or open code in the editor
3. Click "Run" to execute the code
4. View results in the execution results panel

## Migration from WebContainer
- Removed WebContainer dependency
- Replaced with Judge0 API calls
- Added language-specific execution
- Improved error handling and status reporting

## API Limits
- RapidAPI free tier: 100 requests/month
- Consider upgrading for production use
- Self-hosted Piston API for unlimited usage 