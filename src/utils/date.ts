import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function formatDate(dateStr: string, fmt = "dd 'de' MMMM, yyyy"): string {
  try {
    return format(parseISO(dateStr), fmt, { locale: ptBR });
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd MMM, yyyy', { locale: ptBR });
  } catch {
    return dateStr;
  }
}

export function formatTime(time: string): string {
  return time;
}
