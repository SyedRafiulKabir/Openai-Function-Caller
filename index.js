import express from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(express.json());

const port = process.env.PORT || 3000;

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Define your tools as per the documentation
const tools = [
    {
        "type": "function",
        "function": {
            "name": "getCurrentWeather",
            "description": "Get the current weather",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "The city and state, e.g. San Francisco, CA",
                    }
                },
                "required": ["location"]
            },
        }
    },
    {
        "type": "function",
        "function": {
            "name": "getTime",
            "description": "Get time of the day in the user's location",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "The city and state, e.g. San Francisco, CA",
                    }
                },
                "required": ["location"]
            },
        }
    },
    {
        "type": "function",
        "function": {
            "name": "getLocation",
            "description": "Get the user's location",
            "parameters": {
                "type": "object",
                "properties": {
                    "lat": {
                        "type": "string",
                        "description": "lat",
                    },
                    "long": {
                        "type": "string",
                        "description": "long",
                    }
                },
                "required": ["lat", "long"]
            },
        }
    }
];

// Function to call OpenAI API
async function callOpenAI(userprompt, tools) {
    try {
        const messages = [
            {
                role: 'system',
                content: 'You are an assistant that decides which function to call based on the user prompt.'
            },
            {
                role: 'user',
                content: `Based on the following prompt: "${userprompt}", choose the most appropriate function that should be triggered and provide only name and all the property as a object to invoke that function`
            }
        ];

        const response = await openai.chat.completions.create({
            model: 'gpt-4o', // Specify your preferred model here
            messages: messages,
            tools: tools,
            tool_choice: 'auto'
        });

        //console.log('OpenAI Response:', response);

        // Check if choices exist and are not empty
        if (response.choices && response.choices.length > 0) {
            let chosenFunction = response.choices[0].message.content.trim();

            // Remove 'functions.' prefix if present
            if (chosenFunction.startsWith('functions.')) {
                chosenFunction = chosenFunction.replace('functions.', '');
            }

            return chosenFunction;
        } else {
            console.error('Empty response from OpenAI:', response);
            throw new Error('Empty response from OpenAI');
        }

    } catch (error) {
        console.error('OpenAI API Error:', error);
        throw new Error('Failed to get response from OpenAI');
    }
}

// Route to handle POST requests
app.post('/decide-function', async (req, res) => {
    const { userprompt } = req.body;

    if (!userprompt) {
        return res.status(400).send({ error: 'User prompt is required' });
    }

    try {
        const chosenFunction = await callOpenAI(userprompt, tools);
        console.log('Chosen Function:', chosenFunction);
        res.json({ function: chosenFunction });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).send({ error: 'Failed to get response from OpenAI API' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
