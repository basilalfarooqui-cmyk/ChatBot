const theme = {
  colors: {
    bg: '#F7F7FB',
    card: '#FFFFFF',
    accent: '#4F46E5',
    onAccent: '#FFFFFF',
    onAccentMuted: '#E0E7FF',
    text: '#1F2126',
    muted: '#6B7280',
    disabled: '#C7C9D1',
    noteBg: '#FEF3C7',
    noteText: '#92400E',
    border: '#E5E7EB',
  },
  radius: {
    bubble: 18,
    card: 14,
    input: 24,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    h1: { fontSize: 22, fontWeight: '700' as const },
    h2: { fontSize: 17, fontWeight: '600' as const },
    body: { fontSize: 15, fontWeight: '400' as const },
    caption: { fontSize: 11, fontWeight: '400' as const },
  },
};

export default theme;
export type Theme = typeof theme;
