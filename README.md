# Node.js Function Decision Maker with Angular Frontend

This project features a Node.js backend that utilizes OpenAI to determine which function to call based on user prompts, accompanied by an Angular frontend for user interaction.

## Table of Contents
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)

## Technologies Used
- **Backend**: Node.js, Express, OpenAI API
- **Frontend**: Angular, HTML, CSS, Bootstrap

## Getting Started

### Prerequisites
- Node.js
- Angular CLI
- OpenAI API Key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/SyedRafiulKabir/Openai-Function-Caller/
   cd Openai-Function-Caller
2. Install backend dependencies:
   ```bash
    cd backend
    npm install
3. Set up environment variables:
  Create a .env file in the backend directory and add your OpenAI API key:
    ```bash
    OPENAI_API_KEY=your_openai_api_key
4. Start the backend server:
   ```bash
   node index.js

5. Install frontend dependencies:
    ```bash
      cd ../frontend
      npm install

6. Start the Angular development server:
    ```bash
      ng serve


## API Endpoints

### POST /decide-function
#### Description: This endpoint receives a user prompt and returns the name of the function that should be triggered based on the prompt.
1. Request Body:
    ```bash
      {
        "userprompt": "your user prompt"
      }

2. Response:
    ```bash
      {
        "function": "chosen function name"
      }
