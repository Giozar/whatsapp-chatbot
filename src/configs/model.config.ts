// ai/model.config.ts

export const AI_MODEL_CONFIG = {
  /*
  Here you can configure the AI model you want to use.
  - Set AI_MODEL in your .env file to choose the Ollama model (e.g. llama3.2:latest)
  - Set USES_MODELFILE=true if your model is defined via a custom Ollama Modelfile
  */
  model: process.env.AI_MODEL ?? 'llama3.2:latest',
  usesModelfile: process.env.USES_MODELFILE === 'false',
};