// src/palettes.ts

export interface ColorPalette {
  id: string;
  name: string;
  colors: string[]; // Array of HEX color strings
}

export const PALETTES: ColorPalette[] = [
  {
    id: 'automatic',
    name: 'Automatic (No Palette Filter)',
    colors: [], // Empty array means no filter will be applied
  },
  {
    id: 'retro-custom-8',
    name: 'Retro Custom 8-Color',
    colors: [
      '#000000', // Black
      '#FFFFFF', // White
      '#FF0000', // Red
      '#0000FF', // Bright Blue (was #007FFF, changed to pure blue for more primary feel)
      '#00008B', // Dark Blue
      '#A020F0', // Purple
      '#FFFF00', // Yellow
      '#00FF00', // Green
    ],
  },
  {
    id: 'gameboy-classic',
    name: 'Game Boy Classic (4 Colors)',
    colors: ['#CADC9F', '#9BBC0F', '#306230', '#0F380F'],
  },
  {
    id: 'nes-direct',
    name: 'NES Direct (12 Colors)',
    colors: [
      '#000000', '#FCFCFC', '#BC0000', '#FC7460', '#A04000', '#FCA800',
      '#FCE000', '#00A800', '#74FCDC', '#0000BC', '#7878FC', '#BC00BC',
    ],
  },
  {
    id: 'c64-vivid',
    name: 'C64 Vivid (16 Colors)',
    colors: [
      '#000000', '#FFFFFF', '#68372B', '#70A4B2', '#6F3D86', '#588D43',
      '#352879', '#B8C76F', '#6F4F25', '#433900', '#9A6759', '#444444',
      '#6C6C6C', '#9AD284', '#6C5EB5', '#959595',
    ],
  },
  {
    id: 'zx-spectrum-bright',
    name: 'ZX Spectrum Bright (8 Colors)',
    colors: [
      '#000000', // Black
      '#0000CD', // Blue
      '#CD0000', // Red
      '#CD00CD', // Magenta
      '#00CD00', // Green
      '#00CDCD', // Cyan
      '#CDCD00', // Yellow
      '#FFFFFF', // White (Effective white for ZX)
    ],
  },
  {
    id: 'vaporwave-dreams',
    name: 'Vaporwave Dreams (7 Colors)',
    colors: ['#FF71CE', '#01CDFE', '#05FFA1', '#B967FF', '#FFFB96', '#FF9933', '#201335'],
  },
  {
    id: 'molten-core',
    name: 'Molten Core (5 Colors)',
    colors: ['#000000', '#4A0000', '#FF0000', '#FFA500', '#FFFF00'],
  },
  {
    id: 'enchanted-forest',
    name: 'Enchanted Forest (6 Colors)',
    colors: ['#228B22', '#556B2F', '#8B4513', '#A0522D', '#9370DB', '#DEB887'],
  },
  {
    id: 'grayscale-ramp',
    name: 'Grayscale Ramp (7 Colors)',
    colors: ['#000000', '#333333', '#666666', '#999999', '#BBBBBB', '#DDDDDD', '#FFFFFF'],
  },
  {
    id: 'sepia-tone',
    name: 'Sepia Tone (5 Colors)',
    colors: ['#2a1d12', '#50392c', '#704214', '#a07855', '#d4b79b'],
  }
];
