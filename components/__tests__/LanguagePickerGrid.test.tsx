import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import LanguagePickerGrid from '../LanguagePickerGrid';
import { LANGUAGES } from '../../i18n/languages';

describe('LanguagePickerGrid', () => {
  it('renders all 23 languages with native name and English subtitle', () => {
    render(<LanguagePickerGrid onSelect={jest.fn()} />);
    expect(screen.getAllByTestId(/^lang-card-/)).toHaveLength(23);
    expect(screen.getByText('हिन्दी')).toBeTruthy();
    expect(screen.getByText('Hindi')).toBeTruthy();
  });

  it('calls onSelect with the language code when a card is pressed', () => {
    const onSelect = jest.fn();
    render(<LanguagePickerGrid onSelect={onSelect} />);
    fireEvent.press(screen.getByTestId(`lang-card-${LANGUAGES[1].code}`));
    expect(onSelect).toHaveBeenCalledWith(LANGUAGES[1].code);
  });
});
