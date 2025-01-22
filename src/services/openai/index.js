const OpenAI = require('openai');
const generatePrompt = require('./prompt');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

const chatGPT = async ( name, history ) => {

    // const prompt = generatePrompt(name);
    // console.log('[PROMPT]', prompt);
    const completion = await openai.chat.completions.create({
        messages: [
            {
                role: 'system',
                content: generatePrompt(name),
            },
            ...history,
        ],
        model: "gpt-4o-mini-2024-07-18",
        temperature: 0,
        max_tokens: 100,
    });

    console.log(completion.choices[0].message.content);

    const response = completion.choices[0].message.content;
    
    return response;
}

module.exports = chatGPT;