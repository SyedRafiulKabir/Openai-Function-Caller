import express from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import axios from 'axios';
import cors from 'cors';
dotenv.config();

const app = express();
app.use(cors());
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
                        "description": "The city and state, e.g. Dhaka, BD",
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
                        "description": "The city and state, e.g. Dhaka, BD",
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
                role: 'system',
                content: 'You are an assistant that also decides which location  is appropriate based on the user prompt.'
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
            },
            {
                role: 'user',
                content: 'if there is information about location then use that location to get the information about lat and long '
            },
            {
                role: 'user',
                content: 'if there is no information about location then use Dhaka, BD as default location for testing purpose.But if user provide location then use that location to get the information about lat and long'
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
            //console.log("Param:", param);
            

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

    try {
        // Replace with your OpenWeatherMap API key
        const apiKey = process.env.OPENWEATHERMAP_API_KEY;
        const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric`;

        const response = await axios.get(apiUrl);
        const weatherData = response.data;

        // Extract relevant weather information
        const description = weatherData.weather[0].description;
        const temperature = weatherData.main.temp;

        return `Current weather in ${location}: ${description}, Temperature: ${temperature}°C`;
    } catch (error) {
        //console.error('Error fetching weather data:', error);
        throw new Error('Failed to get current weather');
    }
}
async function getTime(params) {
    const { location } = params;

    // Ensure the location is in the correct format for the geocoding API
    const locationFormatted = location.replace(/ /g, '+');

    // Replace with your geocoding API key (from OpenWeatherMap or other service)
    const geocodingApiKey = process.env.OPENWEATHERMAP_API_KEY;
    const geocodingUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${locationFormatted}&limit=1&appid=${geocodingApiKey}`;

    try {
        // Get latitude and longitude for the location
        const geocodingResponse = await axios.get(geocodingUrl);
        const geocodingData = geocodingResponse.data;

        if (geocodingData.length === 0) {
            throw new Error(`Unable to find coordinates for location: ${location}`);
        }

        const { lat, lon } = geocodingData[0];

        // Use latitude and longitude to get the current time
        const timeZoneApiKey = process.env.TIMEZONE_API_KEY; // Replace with your time zone API key
        const timeZoneUrl = `http://api.timezonedb.com/v2.1/get-time-zone?key=${timeZoneApiKey}&format=json&by=position&lat=${lat}&lng=${lon}`;

        const timeZoneResponse = await axios.get(timeZoneUrl);
        const timeZoneData = timeZoneResponse.data;

        // Extract the current time
        const currentTime = timeZoneData.formatted;

        return `Current time in ${location}: ${currentTime}`;
    } catch (error) {
        console.error('Error fetching time data:', error);
        throw new Error('Failed to get current time');
    }
}
async function getLocation(params) {
    let { lat, long } = params;

    // If lat and long are not provided, use Dhaka's coordinates as default
    if (!lat || !long) {
        lat = '23.8103'; // Default latitude for Dhaka
        long = '90.4125'; // Default longitude for Dhaka
    }

    try {
        // Make a request to reverse geocoding API to get location information
        const apiUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${long}`;

        const response = await axios.get(apiUrl);
        const locationData = response.data;

        // Extract formatted address or relevant location information
        const displayName = locationData.display_name;

        return `User's location: ${displayName}`;
    } catch (error) {
        console.error('Error fetching location data:', error);
        throw new Error('Failed to get location');
    }
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
