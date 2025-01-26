const OpenAI = require('openai');
const AgentReponse = require("../../prompts/agentReponse");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const chatGPT = async (username, message, history) => {
  const agent = new AgentReponse();
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: agent.generateResponse(username, message),
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