import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import ChatBubble from '../ChatBubble';
import type { ChatMessage } from '../../store/chatStore';

const userMessage: ChatMessage = { id: '1', role: 'user', text: 'hi there', timestamp: Date.now() };
const assistantMessage: ChatMessage = { id: '2', role: 'assistant', text: 'hello!', timestamp: Date.now() };

describe('ChatBubble', () => {
  it('renders the message text', () => {
    render(<ChatBubble message={userMessage} />);
    expect(screen.getByText('hi there')).toBeTruthy();
  });

  it('shows a play button for assistant messages when showPlay is true, and calls onPlay', () => {
    const onPlay = jest.fn();
    render(<ChatBubble message={assistantMessage} showPlay onPlay={onPlay} />);
    fireEvent.press(screen.getByTestId('play-button'));
    expect(onPlay).toHaveBeenCalled();
  });

  it('does not show a play button for user messages even when showPlay is true', () => {
    render(<ChatBubble message={userMessage} showPlay onPlay={jest.fn()} />);
    expect(screen.queryByTestId('play-button')).toBeNull();
  });

  it('does not show a play button when showPlay is false', () => {
    render(<ChatBubble message={assistantMessage} showPlay={false} onPlay={jest.fn()} />);
    expect(screen.queryByTestId('play-button')).toBeNull();
  });
});
