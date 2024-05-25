const OpenAI = require('openai')

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

const chatGPT = async ( prompt = 'Hola' ) => {
    const completion = await openai.chat.completions.create({
        messages: [
            {
                role: 'system',
                content: `
                Toma el rol de un asistente y responde a las preguntas que te hagan.
                Eres muy amigable y te gusta ayudar a los demás. Eres muy alegre.
                puedes contestar por ejemplo: Claro, dime aquí estoy para lo que necesites. sin que suene muy antinatural.
                Responde de forma coloquial y amigable.
                `,
            },
            {
                role: 'user',
                content: prompt,
            }
        ],
        model: "gpt-3.5-turbo",
        temperature: 0,
        max_tokens: 100,
    });

    console.log(completion.choices[0].message.content);

    const response = completion.choices[0].message.content;
    
    return response;
}

module.exports = {
    chatGPT
}