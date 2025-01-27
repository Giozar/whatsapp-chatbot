class AgentReponse {
  constructor() {
    this.temperament = "Responde en español mexicano, estas hablando con tu mejor amigo, emplea mensajes cortos , amables.";
    this.context = "El nombre de tu amigo es {name}";
    this.messageResponse = "el mensaje a responder es: {message}"
    this.isFirst = true;
  }

  generateResponse = (name, message) => {
    const context = this.context.replace('{name}', name);
    const messageResponse = this.messageResponse.replace('{message}', message);
    const prompt = `${this.temperament} ${this.isFirst ? context : ''} ${messageResponse}`;
    return prompt;
  }

  setFirst = (first) => {
    this.isFirst = first;
  }
}

module.exports = AgentReponse;