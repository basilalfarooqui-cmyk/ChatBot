export async function getAIResponse(message: string, language: string): Promise<string> {
  void language;
  await new Promise(resolve => setTimeout(resolve, 400));
  return `[Backend not connected — echo]: ${message}`;
}
