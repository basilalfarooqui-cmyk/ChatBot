import { getAIResponse } from '../ai';

describe('getAIResponse', () => {
  it('echoes the message with the stub prefix', async () => {
    const result = await getAIResponse('hello there', 'en');
    expect(result).toBe('[Backend not connected — echo]: hello there');
  });

  it('does not resolve synchronously (simulates network latency)', () => {
    jest.useFakeTimers();
    const spy = jest.fn();
    getAIResponse('x', 'hi').then(spy);
    expect(spy).not.toHaveBeenCalled();
    jest.runAllTimers();
    jest.useRealTimers();
  });
});
