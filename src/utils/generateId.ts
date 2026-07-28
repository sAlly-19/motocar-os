export function generateId(): string {
  // Cria um ID forte misturando Data em base36 e um fragmento hexadecimal pseudo-aleatório.
  return `${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}
