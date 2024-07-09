//in.js
import express from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const app = express();
app.use(express.json());

app.post('/decide-function', async (req, res) => {
    const { userprompt } = req.body
    let functionNames = ['getTime', 'getWeather', 'getNews', 'getJoke', 'getQuote'];

    if (!userprompt || !Array.isArray(functionNames) || functionNames.length === 0) {
        return res.status(400).send('Invalid request body');
    }

    try {
        // Prepare the messages for OpenAI chat completion
        const messages = [
        {
            role: 'system',
            content: 'You are an assistant that decides which function to call based on the user prompt.'
        },
        {
            role: 'user',
            content: `Based on the following prompt: "${userprompt}", choose the most appropriate function from the list below: ${functionNames.join(', ')}. Respond with the only name and description of the function that should be triggered.`
        }
        ];

        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: messages,
        });
            console.log(response.choices[0].message.content.trim());
            const chosenFunction = response.choices[0].message.content.trim();
            res.json({ function: chosenFunction });
    }
    catch (error) {
        console.error('Error with OpenAI API:', error);
        res.status(500).send('Internal Server Error');
    }
    });

const PORT = process.env.PORT || 3100;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
