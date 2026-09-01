import { getAIResponse } from '../ai';

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  jest.restoreAllMocks();
});

describe('getAIResponse', () => {
  it('POSTs to the backend and returns its reply', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ reply: 'hi from backend' }),
    }) as unknown as typeof fetch;

    const result = await getAIResponse('hello there', 'en');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/chat'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ message: 'hello there', language: 'en' }),
      })
    );
    expect(result).toBe('hi from backend');
  });

  it('returns a friendly error message when the backend responds with an error status', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 }) as unknown as typeof fetch;

    const result = await getAIResponse('x', 'hi');

    expect(result).toBe('Sorry, I could not reach the server. Please try again.');
  });

  it('returns a friendly error message when the network call throws', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network down')) as unknown as typeof fetch;

    const result = await getAIResponse('x', 'hi');

    expect(result).toBe('Sorry, I could not reach the server. Please try again.');
  });
});
