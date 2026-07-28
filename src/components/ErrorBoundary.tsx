import { Component, ReactNode } from 'react';
import { View } from 'react-native';
import { spacing, borderRadius, themes } from '../theme';
import { ThemeContext } from '../theme/ThemeContext';
import { AppText } from '../ui/Text';
import { Button } from '../ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  static contextType = ThemeContext;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log to console so devs see the error; in production this hook is where you'd wire
    // a crash reporter (Sentry, etc.). We deliberately do not swallow the error silently.
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // If the ThemeContext is unavailable (extremely unlikely since ErrorBoundary is mounted
      // above ThemeProvider in _layout.tsx), fall back to the light palette so we never
      // hardcode raw hex literals in a fallback.
      const context = this.context as { colors: typeof themes.light } | undefined;
      const colors = context?.colors ?? themes.light;

      return this.props.fallback || (
        <View
          accessibilityRole="alert"
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: spacing.xl,
            backgroundColor: colors.background,
          }}
        >
          <AppText variant="h1" align="center" style={{ color: colors.error, marginBottom: spacing.sm }}>
            Algo deu errado
          </AppText>
          <AppText variant="bodySmall" color="text-secondary" align="center" style={{ marginBottom: spacing.lg }}>
            {this.state.error?.message || 'Ocorreu um erro inesperado'}
          </AppText>
          <Button
            title="Tentar novamente"
            variant="destructive"
            onPress={() => this.setState({ hasError: false, error: null })}
          />
        </View>
      );
    }
    return this.props.children;
  }
}
