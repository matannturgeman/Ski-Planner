export const RESORTS = [
  { id: 1, name: 'Val Thorens' },
  { id: 2, name: 'Courchevel' },
  { id: 3, name: 'Tignes' },
  { id: 4, name: 'La Plagne' },
  { id: 5, name: 'Chamonix' },
];

export function getResortName(id: number): string {
  return RESORTS.find((r) => r.id === id)?.name ?? `Resort ${id}`;
}
