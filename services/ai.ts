const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';

export async function getAIResponse(message: string, language: string): Promise<string> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, language }),
    });
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    const data = await response.json();
    return data.reply;
  } catch (error) {
    console.error('getAIResponse error:', error);
    return 'Sorry, I could not reach the server. Please try again.';
  }
}
