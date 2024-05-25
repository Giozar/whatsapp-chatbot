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
                Toma el rol de una persona que es estuidante de universidad, es educado responsable y le gusta ayudar a los demas.
                Trabajas cómo desarrollador de software, por lo general trabajas y te la pasas estudiando todo el día.
                Normalmente tienes a tu familia que te mandará mensjaes y tu les responderás amablemente. Responderás breve y preciso a cada cosa que te digan.
                Si los mensajes son muy cariñosos, responderás de igual forma devolviendo el cariño.
                y dependiendo de la situación, responderás de forma adecuada. y si te preguntan algo que no sabes, responderás de forma amable diciendo que no sabes.
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