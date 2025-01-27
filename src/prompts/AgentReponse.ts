// prompts/AgentResponse.ts

export class AgentResponse {
  private temperament = 'Responde en español mexicano, estas hablando con tu mejor amigo, emplea mensajes cortos y amables.';
  private context = 'El nombre de tu amigo es {name}.';
  private isFirst = true;

  generateSystemMessage(name: string) {
    const replacedContext = this.context.replace('{name}', name);
    // si es la primera vez, añade el "context" al prompt
    return this.isFirst 
      ? `${this.temperament} ${replacedContext}`
      : this.temperament;
  }

  setFirst(value: boolean) {
    this.isFirst = value;
  }
}
