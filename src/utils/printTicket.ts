import { Platform } from 'react-native';
import * as Print from 'expo-print';

/**
 * Cross-platform ticket printer.
 *
 * - Mobile (iOS/Android): uses `expo-print` which renders the HTML into the
 *   native print dialog / PDF.
 * - Web: expo-print.web falls back to `window.print()` on the current page,
 *   which would print the app UI (menu, sidebar, etc). To avoid that we open
 *   a new window, write the ticket HTML into it, and trigger the browser's
 *   print dialog from there. The user can then save as PDF.
 */
export async function printTicket(html: string): Promise<void> {
  if (Platform.OS === 'web') {
    // Open a blank popup and inject the ticket HTML.
    const w = typeof window !== 'undefined' ? window.open('', '_blank', 'width=900,height=1200') : null;
    if (!w) {
      throw new Error('Popup bloqueado pelo navegador. Habilite popups para imprimir.');
    }
    w.document.open();
    w.document.write(html);
    w.document.close();

    // Wait for the popup DOM to be ready, then trigger print.
    const trigger = () => {
      try {
        w.focus();
        w.print();
      } catch {
        // Some browsers throw synchronously if window is closed already.
      }
    };
    // Chrome/Edge: readyState becomes 'complete' quickly.
    if (w.document.readyState === 'complete') {
      // Give the browser one tick to layout the page before printing.
      setTimeout(trigger, 150);
    } else {
      w.addEventListener('load', () => setTimeout(trigger, 150));
    }
    return;
  }
  // Native (iOS/Android).
  await Print.printAsync({ html });
}
