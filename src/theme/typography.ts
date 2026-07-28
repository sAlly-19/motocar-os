import { TextStyle } from 'react-native';

export const typography: Record<string, TextStyle> = {
  'headline-lg': {
    fontFamily: 'Inter_700Bold',
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.64,
    fontWeight: '700',
  },
  'headline-lg-mobile': {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.24,
    fontWeight: '700',
  },
  'headline-md': {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.24,
    fontWeight: '600',
  },
  'headline-sm': {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
  },
  'body-lg': {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  'body-md': {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  'label-md': {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
    fontWeight: '600',
  },
  'label-sm': {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
  },
};
