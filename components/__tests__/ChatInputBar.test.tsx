import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import ChatInputBar from '../ChatInputBar';

jest.mock('../../i18n/LanguageContext', () => ({
  useLanguage: () => ({ t: (k: string) => k }),
}));

describe('ChatInputBar', () => {
  it('calls onChangeText when typing', () => {
    const onChangeText = jest.fn();
    render(
      <ChatInputBar
        value=""
        onChangeText={onChangeText}
        onSend={jest.fn()}
        onMicPress={jest.fn()}
        micEnabled={false}
        isListening={false}
      />
    );
    fireEvent.changeText(screen.getByTestId('chat-input'), 'hello');
    expect(onChangeText).toHaveBeenCalledWith('hello');
  });

  it('disables send when value is empty and enables it with text', () => {
    const onSend = jest.fn();
    const { rerender } = render(
      <ChatInputBar
        value=""
        onChangeText={jest.fn()}
        onSend={onSend}
        onMicPress={jest.fn()}
        micEnabled={false}
        isListening={false}
      />
    );
    fireEvent.press(screen.getByTestId('send-button'));
    expect(onSend).not.toHaveBeenCalled();

    rerender(
      <ChatInputBar
        value="hi"
        onChangeText={jest.fn()}
        onSend={onSend}
        onMicPress={jest.fn()}
        micEnabled={false}
        isListening={false}
      />
    );
    fireEvent.press(screen.getByTestId('send-button'));
    expect(onSend).toHaveBeenCalled();
  });

  it('does not call onMicPress when mic is disabled', () => {
    const onMicPress = jest.fn();
    render(
      <ChatInputBar
        value=""
        onChangeText={jest.fn()}
        onSend={jest.fn()}
        onMicPress={onMicPress}
        micEnabled={false}
        isListening={false}
      />
    );
    fireEvent.press(screen.getByTestId('mic-button'));
    expect(onMicPress).not.toHaveBeenCalled();
  });

  it('calls onMicPress when mic is enabled', () => {
    const onMicPress = jest.fn();
    render(
      <ChatInputBar
        value=""
        onChangeText={jest.fn()}
        onSend={jest.fn()}
        onMicPress={onMicPress}
        micEnabled
        isListening={false}
      />
    );
    fireEvent.press(screen.getByTestId('mic-button'));
    expect(onMicPress).toHaveBeenCalled();
  });

  it('disables the mic and input, and shows the transcribing placeholder, while transcribing', () => {
    const onMicPress = jest.fn();
    render(
      <ChatInputBar
        value=""
        onChangeText={jest.fn()}
        onSend={jest.fn()}
        onMicPress={onMicPress}
        micEnabled
        isListening={false}
        isTranscribing
      />
    );
    fireEvent.press(screen.getByTestId('mic-button'));
    expect(onMicPress).not.toHaveBeenCalled();
    expect(screen.getByTestId('chat-input').props.editable).toBe(false);
    expect(screen.getByTestId('chat-input').props.placeholder).toBe('transcribing');
  });
});
