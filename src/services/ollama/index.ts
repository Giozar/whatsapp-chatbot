import { Ollama } from "ollama";
import { AgentResponse } from "~/prompts/AgentReponse";

const ollama = new Ollama({ host: "http://localhost:11434" });

export const OllamaService = async ({
    username,
    history,
}) => {
    try {
        const agent = new AgentResponse();

        // Si no hay mensajes anteriores en el historial
        agent.setFirst(history.length === 0);

        const systemMessage = {
            role: 'system',
            content: agent.generateSystemMessage(username),
        };

        const messages = [systemMessage, ...history];

        const completion = await ollama.chat({
            model: 'gemma4:e2b',
            messages,
        });

        const response = completion.message.content;
        return response;
    } catch (error) {
        console.error('[Error en OllamaService]', error);
        return 'Lo siento, hubo un error al procesar tu mensaje.';
    }
};