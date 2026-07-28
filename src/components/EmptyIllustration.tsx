import Svg, { Path, Circle, Rect, G, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useThemeColors } from '../theme';

export type IllustrationName =
  | 'empty-box'
  | 'empty-clipboard'
  | 'empty-search'
  | 'empty-inventory'
  | 'empty-quotes'
  | 'empty-team'
  | 'empty-schedule';

interface EmptyIllustrationProps {
  name: IllustrationName;
  size?: number;
}

/**
 * Lightweight illustrated empty-state graphics — no external assets,
 * pure react-native-svg so they scale + inherit theme colors.
 */
export function EmptyIllustration({ name, size = 140 }: EmptyIllustrationProps) {
  const colors = useThemeColors();
  const c = {
    primary: colors.primary,
    secondary: colors.secondary,
    surface: colors['surface-container'],
    surfaceHi: colors['surface-container-high'],
    outline: colors['outline-variant'],
    ink: colors['on-surface-variant'],
  };

  const s = size;
  const vb = '0 0 200 160';

  switch (name) {
    case 'empty-box':
    case 'empty-inventory':
      return (
        <Svg width={s} height={s * 0.8} viewBox={vb}>
          {/* Shadow */}
          <Circle cx="100" cy="145" r="55" fill={c.surface} opacity={0.6} />
          {/* Box body */}
          <Path d="M50 70 L100 55 L150 70 L150 130 L100 145 L50 130 Z" fill={c.surfaceHi} stroke={c.outline} strokeWidth="2" />
          {/* Box lid open */}
          <Path d="M50 70 L100 85 L150 70" fill="none" stroke={c.outline} strokeWidth="2" />
          <Path d="M100 85 L100 145" stroke={c.outline} strokeWidth="2" />
          {/* Ribbon */}
          <Path d="M100 55 L100 85" stroke={c.primary} strokeWidth="4" />
          <Path d="M85 62 L100 55 L115 62" stroke={c.primary} strokeWidth="3" fill="none" />
          {/* Sparkles */}
          <Circle cx="40" cy="45" r="3" fill={c.secondary} opacity={0.7} />
          <Circle cx="165" cy="55" r="2.5" fill={c.primary} opacity={0.6} />
          <Circle cx="30" cy="90" r="2" fill={c.secondary} opacity={0.5} />
        </Svg>
      );

    case 'empty-clipboard':
      return (
        <Svg width={s} height={s * 0.8} viewBox={vb}>
          <Circle cx="100" cy="145" r="55" fill={c.surface} opacity={0.6} />
          {/* Clipboard back */}
          <Rect x="55" y="35" width="90" height="105" rx="8" fill={c.surfaceHi} stroke={c.outline} strokeWidth="2" />
          {/* Clip */}
          <Rect x="82" y="26" width="36" height="16" rx="4" fill={c.primary} />
          <Rect x="88" y="30" width="24" height="8" rx="2" fill={c.surface} />
          {/* Lines */}
          <Line x1="68" y1="65" x2="132" y2="65" stroke={c.outline} strokeWidth="2" strokeLinecap="round" />
          <Line x1="68" y1="80" x2="120" y2="80" stroke={c.outline} strokeWidth="2" strokeLinecap="round" />
          <Line x1="68" y1="95" x2="110" y2="95" stroke={c.outline} strokeWidth="2" strokeLinecap="round" />
        </Svg>
      );

    case 'empty-search':
      return (
        <Svg width={s} height={s * 0.8} viewBox={vb}>
          <Circle cx="100" cy="145" r="55" fill={c.surface} opacity={0.6} />
          {/* Magnifier */}
          <Circle cx="90" cy="75" r="35" fill={c.surfaceHi} stroke={c.outline} strokeWidth="3" />
          <Circle cx="90" cy="75" r="20" fill="none" stroke={c.primary} strokeWidth="2" opacity={0.4} />
          <Line x1="115" y1="100" x2="140" y2="125" stroke={c.primary} strokeWidth="6" strokeLinecap="round" />
          {/* Question mark */}
          <Path d="M85 68 Q85 60 92 60 Q99 60 99 66 Q99 72 92 74 L92 80" stroke={c.ink} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <Circle cx="92" cy="86" r="1.5" fill={c.ink} />
        </Svg>
      );

    case 'empty-quotes':
      return (
        <Svg width={s} height={s * 0.8} viewBox={vb}>
          <Circle cx="100" cy="145" r="55" fill={c.surface} opacity={0.6} />
          {/* Document */}
          <Rect x="55" y="30" width="80" height="105" rx="4" fill={c.surface} stroke={c.outline} strokeWidth="2" />
          <Rect x="70" y="42" width="50" height="4" rx="2" fill={c.primary} />
          <Rect x="70" y="55" width="50" height="2" rx="1" fill={c.outline} />
          <Rect x="70" y="63" width="45" height="2" rx="1" fill={c.outline} />
          <Rect x="70" y="71" width="40" height="2" rx="1" fill={c.outline} />
          <Rect x="70" y="88" width="50" height="20" rx="4" fill={c.surfaceHi} />
          {/* Coin badge */}
          <Circle cx="140" cy="120" r="20" fill={c.primary} />
          <Path d="M140 108 L140 132 M133 116 Q140 111 147 116 Q140 121 133 121 Q140 126 147 121" stroke={c.surface} strokeWidth="2" fill="none" strokeLinecap="round" />
        </Svg>
      );

    case 'empty-team':
      return (
        <Svg width={s} height={s * 0.8} viewBox={vb}>
          <Circle cx="100" cy="145" r="55" fill={c.surface} opacity={0.6} />
          {/* 3 avatars */}
          <G>
            <Circle cx="70" cy="70" r="22" fill={c.surfaceHi} stroke={c.outline} strokeWidth="2" />
            <Circle cx="70" cy="64" r="8" fill={c.ink} opacity={0.4} />
            <Path d="M55 82 Q70 74 85 82" fill={c.ink} opacity={0.4} />
          </G>
          <G>
            <Circle cx="130" cy="70" r="22" fill={c.surfaceHi} stroke={c.outline} strokeWidth="2" />
            <Circle cx="130" cy="64" r="8" fill={c.ink} opacity={0.4} />
            <Path d="M115 82 Q130 74 145 82" fill={c.ink} opacity={0.4} />
          </G>
          <G>
            <Circle cx="100" cy="105" r="26" fill={c.primary} />
            <Path d="M100 100 L100 115 M92 107 L108 107" stroke={c.surface} strokeWidth="3" strokeLinecap="round" />
          </G>
        </Svg>
      );

    case 'empty-schedule':
      return (
        <Svg width={s} height={s * 0.8} viewBox={vb}>
          <Circle cx="100" cy="145" r="55" fill={c.surface} opacity={0.6} />
          {/* Calendar */}
          <Rect x="50" y="45" width="100" height="90" rx="8" fill={c.surface} stroke={c.outline} strokeWidth="2" />
          <Rect x="50" y="45" width="100" height="18" rx="8" fill={c.primary} />
          <Line x1="70" y1="38" x2="70" y2="55" stroke={c.primary} strokeWidth="4" strokeLinecap="round" />
          <Line x1="130" y1="38" x2="130" y2="55" stroke={c.primary} strokeWidth="4" strokeLinecap="round" />
          {/* Grid */}
          <Line x1="50" y1="80" x2="150" y2="80" stroke={c.outline} strokeWidth="1" />
          <Line x1="50" y1="100" x2="150" y2="100" stroke={c.outline} strokeWidth="1" />
          <Line x1="50" y1="120" x2="150" y2="120" stroke={c.outline} strokeWidth="1" />
          <Line x1="75" y1="63" x2="75" y2="135" stroke={c.outline} strokeWidth="1" />
          <Line x1="100" y1="63" x2="100" y2="135" stroke={c.outline} strokeWidth="1" />
          <Line x1="125" y1="63" x2="125" y2="135" stroke={c.outline} strokeWidth="1" />
        </Svg>
      );

    default:
      return null;
  }
}
