// testChatbot.js
const axios = require('axios');

const message = "What is the time?";

axios.post('http://localhost:3000/chat', { message })
    .then(response => {
        console.log('Response from chatbot:', response.data);
    })
    .catch(error => {
        console.error('Error:', error.message);
    });
