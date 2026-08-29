import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { ThemeProvider, useTheme } from '../ThemeContext';
import theme from '../theme';

function Probe() {
  const { colors, spacing } = useTheme();
  return (
    <Text testID="probe">{colors.accent}|{spacing.md}</Text>
  );
}

describe('ThemeContext', () => {
  it('provides the theme colors and spacing to consumers', () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );
    expect(screen.getByTestId('probe').props.children.join('')).toBe(
      `${theme.colors.accent}|${theme.spacing.md}`
    );
  });
});
