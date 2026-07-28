import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColors } from '../theme';

type MaterialIconName = keyof typeof MaterialIcons.glyphMap;

/**
 * Aliases para nomes que NÃO existem tal-qual no MaterialIcons ou que
 * queremos mapear para um ícone diferente. Todo o resto é resolvido
 * dinamicamente por conversão `snake_case` -> `kebab-case`, que é o padrão
 * dos nomes na fonte MaterialIcons empacotada com `@expo/vector-icons`.
 */
const ALIAS_MAP: Record<string, MaterialIconName> = {
  // Substitutos legados / renomes semânticos
  inventory_2: 'inventory',
  oil_barrel: 'local-gas-station',
  tire_repair: 'build',
  identity_platform: 'badge',
  key: 'vpn-key',
  sticky_note_2: 'note',
  download: 'file-download',
  add_a_photo: 'add-a-photo',
  'add-a-photo': 'add-a-photo',

  // Ícones que não existem no MaterialIcons básico deste bundle,
  // mapeados para alternativas visualmente equivalentes.
  two_wheeler: 'directions-bike', // motocicleta genérica
  wb_sunny: 'wb-sunny',
  do_not_disturb_on: 'do-not-disturb-on',
  block: 'block',
};

/**
 * Converte `snake_case` -> `kebab-case`. É idempotente para nomes que já
 * estão em kebab-case.
 */
function snakeToKebab(name: string): string {
  return name.replace(/_/g, '-');
}

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  fill?: boolean;
  style?: any;
}

/**
 * Ícone genérico do app. Aceita nomes no padrão Material (snake_case ou
 * kebab-case) — internamente converte para o formato exigido pelo pacote
 * `@expo/vector-icons`. Se o glyph não existir, cai em `help-outline` para
 * evitar exibir um `?` genérico da fonte.
 */
export function Icon({ name, size = 24, color: colorProp, fill, style }: IconProps) {
  const colors = useThemeColors();
  const color = colorProp ?? colors.primary;

  const aliased = ALIAS_MAP[name];
  const candidate = (aliased ?? snakeToKebab(name)) as MaterialIconName;
  const finalName: MaterialIconName =
    candidate in MaterialIcons.glyphMap
      ? candidate
      : ('help-outline' as MaterialIconName);

  return (
    <MaterialIcons
      name={finalName}
      size={size}
      color={color}
      style={[fill ? { fontWeight: '900' } : undefined, style]}
    />
  );
}
