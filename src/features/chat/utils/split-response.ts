export const splitResponseIntoChunks = (response: string): string[] =>
    response
        .split(/(?<!\d)\.\s+/g)
        .map((chunk) => chunk.trim())
        .filter(Boolean);

