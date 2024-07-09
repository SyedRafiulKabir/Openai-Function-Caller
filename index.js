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
                        "description": "Latitude",
                    },
                    "long": {
                        "type": "string",
                        "description": "Longitude",
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
            },
            {
                role: 'user',
                content: `always give the output like this format: {
                                                                        "name": "functionName",
                                                                        "properties": {
                                                                            "one or two property depending on function defination"
                                                                        }
                                                                    }`
            }
        ];

        const response = await openai.chat.completions.create({
            model: 'gpt-4o', // Specify your preferred model here
            messages: messages,
            tools: tools,
            tool_choice: 'auto'
        });

        // Check if choices exist and are not empty
        if (response.choices && response.choices.length > 0) {
            let chosenFunction = response.choices[0].message.content.trim();
            
            //console.log("Response: ",chosenFunction);
            //chosenFunction = chosenFunction.replace(/```json|```/g, '');
            // Extract function name and parameters from chosenFunction
            let functionObj = JSON.parse(chosenFunction);
            // Extract functionName and param

            let functionName = functionObj.name;
            // Remove 'functions.' prefix if present
            if (functionName.startsWith('functions.')) {
                functionName = functionName.replace('functions.', '');
            } // "functions.getLocation"
            
            let param = functionObj.properties;
            //console.log("Function Name:", functionName);
            console.log("Param:", param);
            

            return { functionName, param };
        } else {
            console.error('Empty response from OpenAI:', response);
            throw new Error('Empty response from OpenAI');
        }

    } catch (error) {
        console.error('OpenAI API Error:', error);
        throw new Error('Failed to get response from OpenAI');
    }
}

// Define functions to perform specific tasks
async function getCurrentWeather(params) {
    const { location } = params;
    // Implement logic to get current weather using location
    return `Current weather for ${location}: Sunny, 25°C`;
}

async function getTime(params) {
    const { location } = params;
    // Implement logic to get current time using location
    return `Current time in ${location}: 12:00 PM`;
}

async function getLocation(params) {
    const { lat, long } = params;
    // Implement logic to get location using lat and long
    return `User's location: Latitude ${lat}, Longitude ${long}`;
}

// Route to handle POST requests
app.post('/decide-function', async (req, res) => {
    const { userprompt } = req.body;

    if (!userprompt) {
        return res.status(400).send({ error: 'User prompt is required' });
    }

    try {
        const { functionName, param} = await callOpenAI(userprompt, tools);
        console.log("Function name:", functionName);

        // Dynamically call the appropriate function based on functionName
        let result;
        switch (functionName) {
            case 'getCurrentWeather':
                result = await getCurrentWeather(param);
                break;
            case 'getTime':
                result = await getTime(param);
                break;
            case 'getLocation':
                result = await getLocation(param);
                break;
            default:
                throw new Error(`Unknown function name returned from OpenAI: ${functionName}`);
        }

        console.log('Function Result:', result);
        res.json({ result });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).send({ error: 'Failed to process request' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
