# Code Sphere AI  
## AI-Driven Community & Online Coding Platform

Code Sphere AI is a full-featured, AI-powered coding community platform that enables developers to collaborate, communicate, write code, execute programs in multiple languages, and share files in real time. The platform combines an online compiler, AI-powered code editor, real-time chat, and secure authentication into a single scalable system.

---

## Overview

Code Sphere AI is designed to solve multiple problems faced by developers by providing a unified environment where learning, collaboration, and coding happen together. Users can join communities, discuss problems, write and run code online, collaborate on files, and get AI assistance without switching platforms.

---

## Features

- Multi-language online code compiler with real-time execution
- AI-powered code editor for code explanation, debugging, and optimization
- Community-based real-time chat using WebSockets
- File upload, download, and collaborative sharing
- Secure user authentication and authorization
- Scalable and modular full-stack architecture
- Responsive user interface for all screen sizes

---

## Online Code Compiler

The platform includes a complete server-side online compiler that supports multiple programming languages. Users can write code directly in the browser, execute it securely on the server, and view output or errors instantly.

Key capabilities include:
- Multi-language support
- Secure sandboxed execution
- Real-time output and error handling
- Efficient execution management

---

## AI-Powered Code Editor

The AI-powered editor acts as an intelligent coding assistant. It helps users understand complex logic, identify bugs, suggest improvements, and provide optimized solutions. AI responses are contextual and designed to enhance productivity rather than replace learning.

---

## Communities and Real-Time Chat

Code Sphere AI provides community-based chat rooms where developers can interact in real time. The chat system is built using WebSockets to ensure low latency and reliable communication, making it ideal for collaborative problem solving and discussions.

---

## File Sharing and Collaboration

Users can upload, download, and share files within communities. File access is controlled through authentication to ensure security. This feature enables team-based collaboration and project sharing inside the platform.

---

## Authentication and Security

User authentication is handled using JSON Web Tokens (JWT). Protected routes and APIs ensure that only authorized users can access sensitive resources. Token expiration and validation mechanisms enhance overall platform security.

---

## System Architecture

The platform follows a client-server architecture where the frontend communicates with the backend through HTTP and WebSocket connections. The backend manages authentication, real-time communication, AI integration, code execution, and file handling, while the database stores users, communities, messages, and file metadata.

---

## Technology Stack

Frontend:
- HTML5
- CSS3
- JavaScript (ES6+)

Backend:
- Node.js
- Express.js
- Socket.io
- JWT Authentication

Database:
- MongoDB
- Redis

AI:
- OpenAI or Gemini API

---

## Project Structure

Ai-Driven-Community-For-Coders/ ├── frontend/ ├── backend/ │   ├── routes/ │   ├── controllers/ │   ├── middleware/ │   ├── socket/ │   ├── compiler/ │   └── ai/ ├── database/ ├── package.json └── README.md

---

## Installation

Clone the repository:

git clone https://github.com/Sourav1923/Ai-Driven-Community-For-Coders.git

Install dependencies:

npm install

---

## Running the Application

Start the server:

npm start

For development mode:

npm run dev

Open the application in your browser at:

http://localhost:3000

---

## Scalability and Performance

The application is designed with scalability in mind. WebSocket-based communication allows real-time collaboration, while modular backend services make it easy to scale components independently.

---

## Challenges and Learning Outcomes

This project helped in gaining hands-on experience with real-time systems, secure code execution, AI integration, and full-stack application design. It strengthened understanding of WebSockets, authentication, backend scalability, and AI-assisted development workflows.

---

## Contributing

Contributions are welcome. Fork the repository, create a new branch, commit your changes, and submit a pull request following standard GitHub practices.

---

## License

This project is licensed under the MIT License.

---

## Author

Sourav Mahapatra  

GitHub: https://github.com/Sourav1923

---

If you find this project useful, consider starring the repository.
