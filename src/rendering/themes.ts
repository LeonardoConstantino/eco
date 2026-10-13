import { PaletteDefinition, PaletteThemeId } from '../types';

export const PALETTES: Record<PaletteThemeId, PaletteDefinition> = {
  default: {
    id: 'default',
    name: 'Brinquedo Original',
    description: 'A paleta canônica de ECO: Vermelho, Verde, Azul e Amarelo com glow profundo.',
    pads: [
      {
        id: 0,
        name: 'Vermelho Memória',
        noteName: 'Dó (C4)',
        freq: 261.63,
        baseColor: '#800c14',
        activeColor: '#FF2A2A',
        glowColor: 'rgba(255, 42, 42, 0.85)',
        glowRadius: 46,
        glowAlpha: 0.8,
        character: 'IMPULSO'
      },
      {
        id: 1,
        name: 'Verde Pulso',
        noteName: 'Mi (E4)',
        freq: 329.63,
        baseColor: '#0a631e',
        activeColor: '#22FF50',
        glowColor: 'rgba(34, 255, 80, 0.85)',
        glowRadius: 46,
        glowAlpha: 0.8,
        character: 'CONTINUIDADE'
      },
      {
        id: 2,
        name: 'Azul Profundo',
        noteName: 'Sol (G4)',
        freq: 392.00,
        baseColor: '#0c3882',
        activeColor: '#2B8CFF',
        glowColor: 'rgba(43, 140, 255, 0.85)',
        glowRadius: 46,
        glowAlpha: 0.8,
        character: 'PROFUNDIDADE'
      },
      {
        id: 3,
        name: 'Amarelo Eco',
        noteName: 'Si♭ (B♭4)',
        freq: 466.16,
        baseColor: '#786808',
        activeColor: '#FFE524',
        glowColor: 'rgba(255, 229, 36, 0.85)',
        glowRadius: 46,
        glowAlpha: 0.8,
        character: 'ALERTA'
      }
    ]
  },
  neon: {
    id: 'neon',
    name: 'Neon Arcade',
    description: 'Cores hipervibrantes inspiradas nas luzes eletromagnéticas dos arcades.',
    pads: [
      {
        id: 0,
        name: 'Magenta Neon',
        noteName: 'Dó (C4)',
        freq: 261.63,
        baseColor: '#7a0050',
        activeColor: '#FF00A0',
        glowColor: 'rgba(255, 0, 160, 0.9)',
        glowRadius: 52,
        glowAlpha: 0.85,
        character: 'IMPULSO'
      },
      {
        id: 1,
        name: 'Ciano Laser',
        noteName: 'Mi (E4)',
        freq: 329.63,
        baseColor: '#005f6b',
        activeColor: '#00F5FF',
        glowColor: 'rgba(0, 245, 255, 0.9)',
        glowRadius: 52,
        glowAlpha: 0.85,
        character: 'CONTINUIDADE'
      },
      {
        id: 2,
        name: 'Violeta Elétrico',
        noteName: 'Sol (G4)',
        freq: 392.00,
        baseColor: '#4f137e',
        activeColor: '#A832FF',
        glowColor: 'rgba(168, 50, 255, 0.9)',
        glowRadius: 52,
        glowAlpha: 0.85,
        character: 'PROFUNDIDADE'
      },
      {
        id: 3,
        name: 'Lima Âmbar',
        noteName: 'Si♭ (B♭4)',
        freq: 466.16,
        baseColor: '#636b00',
        activeColor: '#EAFF00',
        glowColor: 'rgba(234, 255, 0, 0.9)',
        glowRadius: 52,
        glowAlpha: 0.85,
        character: 'ALERTA'
      }
    ]
  },
  mono: {
    id: 'mono',
    name: 'Monochrome',
    description: 'Estética minimalista brutalista de fósforo e pura gradação de luminosidade.',
    pads: [
      {
        id: 0,
        name: 'Branco Puro',
        noteName: 'Dó (C4)',
        freq: 261.63,
        baseColor: '#42454a',
        activeColor: '#FFFFFF',
        glowColor: 'rgba(255, 255, 255, 0.95)',
        glowRadius: 48,
        glowAlpha: 0.9,
        character: 'IMPULSO'
      },
      {
        id: 1,
        name: 'Prata Fria',
        noteName: 'Mi (E4)',
        freq: 329.63,
        baseColor: '#30343a',
        activeColor: '#CFD7E6',
        glowColor: 'rgba(207, 215, 230, 0.9)',
        glowRadius: 48,
        glowAlpha: 0.85,
        character: 'CONTINUIDADE'
      },
      {
        id: 2,
        name: 'Chumbo Lunar',
        noteName: 'Sol (G4)',
        freq: 392.00,
        baseColor: '#24272c',
        activeColor: '#9AA4B2',
        glowColor: 'rgba(154, 164, 178, 0.85)',
        glowRadius: 48,
        glowAlpha: 0.85,
        character: 'PROFUNDIDADE'
      },
      {
        id: 3,
        name: 'Platina Âmbar',
        noteName: 'Si♭ (B♭4)',
        freq: 466.16,
        baseColor: '#3c3d35',
        activeColor: '#FFF8DB',
        glowColor: 'rgba(255, 248, 219, 0.9)',
        glowRadius: 48,
        glowAlpha: 0.9,
        character: 'ALERTA'
      }
    ]
  },
  space: {
    id: 'space',
    name: 'Deep Space',
    description: 'Tons cósmicos de nebulosa interestelar, silêncio e radiação.',
    pads: [
      {
        id: 0,
        name: 'Supernova',
        noteName: 'Dó (C4)',
        freq: 261.63,
        baseColor: '#751025',
        activeColor: '#FF3366',
        glowColor: 'rgba(255, 51, 102, 0.85)',
        glowRadius: 50,
        glowAlpha: 0.85,
        character: 'IMPULSO'
      },
      {
        id: 1,
        name: 'Aurora Boreal',
        noteName: 'Mi (E4)',
        freq: 329.63,
        baseColor: '#00574b',
        activeColor: '#00FFCC',
        glowColor: 'rgba(0, 255, 204, 0.85)',
        glowRadius: 50,
        glowAlpha: 0.85,
        character: 'CONTINUIDADE'
      },
      {
        id: 2,
        name: 'Abismo Cósmico',
        noteName: 'Sol (G4)',
        freq: 392.00,
        baseColor: '#281a6e',
        activeColor: '#7952FF',
        glowColor: 'rgba(121, 82, 255, 0.85)',
        glowRadius: 50,
        glowAlpha: 0.85,
        character: 'PROFUNDIDADE'
      },
      {
        id: 3,
        name: 'Pulsar Solar',
        noteName: 'Si♭ (B♭4)',
        freq: 466.16,
        baseColor: '#6e3c08',
        activeColor: '#FFAA00',
        glowColor: 'rgba(255, 170, 0, 0.85)',
        glowRadius: 50,
        glowAlpha: 0.85,
        character: 'ALERTA'
      }
    ]
  }
};
