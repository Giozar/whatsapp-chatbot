const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

const preguntasChatgpt = async ({ prompt } ) => {

    const response = await openai.chat.completions.create({
        messages: [
            {
                role: "system",
                content: `
                Se te dará una pregunta y tu tarea es dar una respuesta certera y precisa.
                `,
            },
            {
                role: 'user',
                content: prompt,
            }
        ],
        stream: true,
        model: "gpt-3.5-turbo",
        temperature: 0,
        max_tokens: 200,
    });

    return response.choices[0].message.content;
}

module.exports = preguntasChatgpt;