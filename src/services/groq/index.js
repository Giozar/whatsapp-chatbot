const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const GROQ = async (message) => {
  const completion = await groq.chat.completions
    .create({
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
      model: "llama-3.3-70b-versatile",
    });

  const response = completion.choices[0].message.content;

  return response;
}


module.exports = GROQ;