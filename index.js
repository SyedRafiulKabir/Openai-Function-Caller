require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { OpenAI } = require('openai');

const app = express();
const port = 3000;

app.use(bodyParser.json());

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    //organizationId: process.env.OPENAI_ORG_ID // If applicable
});

// Define your tools as per the documentation
const tools = [
    {
        "type": "function",
        "function": {
            "name": "get_current_weather",
            "description": "Get the current weather",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "The city and state, e.g. San Francisco, CA",
                    },
                    "format": {
                        "type": "string",
                        "enum": ["celsius", "fahrenheit"],
                        "description": "The temperature unit to use. Infer this from the users location.",
                    },
                },
                "required": ["location", "format"],
            },
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_n_day_weather_forecast",
            "description": "Get an N-day weather forecast",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "The city and state, e.g. San Francisco, CA",
                    },
                    "format": {
                        "type": "string",
                        "enum": ["celsius", "fahrenheit"],
                        "description": "The temperature unit to use. Infer this from the users location.",
                    },
                    "num_days": {
                        "type": "integer",
                        "description": "The number of days to forecast",
                    }
                },
                "required": ["location", "format", "num_days"]
            },
        }
    }
];

// Function to handle chat completions request
async function callOpenAI(messages, tools) {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo', // Specify your preferred model here
            messages: messages,
            tools: tools,
            tool_choice: 'auto'
        });

        console.log('OpenAI Response:', response);

        const aiMessage = response.data.choices[0].message.content;

        return aiMessage; // Return AI message
    } catch (error) {
        console.error('OpenAI API Error:', error);
        throw new Error('Failed to get response from OpenAI');
    }
}

// Route to handle POST requests
app.post('/call', async (req, res) => {
    const userMessage = req.body.message;
    const description = req.body.description; // Optional description if needed

    if (!userMessage) {
        return res.status(400).send({ error: 'Message is required' });
    }

    try {
        const messages = [
            { role: 'system', content: 'Specify what information you need. Ask for clarification if necessary.' },
            { role: 'user', content: userMessage }
        ];

        const aiResponse = await callOpenAI(messages, tools);
        res.send({ message: aiResponse });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).send({ error: 'Failed to get response from OpenAI api' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
