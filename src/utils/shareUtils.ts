import { PlayerStats } from '../types';

export const APP_URL = 'https://leonardoconstantino.github.io/eco/';

export function generateEvolutionShareText(stats: PlayerStats): string {
  const maxScore = Math.max(0, ...(Object.values(stats.bestScore) as number[]));
  const totalAllGames = (Object.values(stats.totalGames) as number[]).reduce((a, b) => a + b, 0);

  return `⚡ ECO — Jogo Sensorial de Memória & Ritmo

🧠 Minha evolução sonora no ECO:
🏆 Maior Sequência: ${maxScore} passos
🎮 Partidas Jogadas: ${totalAllGames}
🎵 Total de Passos Memorizados: ${stats.totalSequencesCompleted}

• Clássico: ${stats.bestScore.classic || 0} passos
• Tabuleiro Vivo: ${stats.bestScore.liveboard || 0} passos
• Eco Reverso: ${stats.bestScore.reverse || 0} passos
• Zen: ${stats.bestScore.zen || 0} ciclos

Será que sua percepção consegue superar meu eco?
👉 Jogue grátis agora: ${APP_URL}`;
}

export function generateGameResultShareText(score: number, modeName: string, isNewRecord: boolean): string {
  const recordBanner = isNewRecord ? '🏆 NOVO RECORDE PESSOAL!\n' : '';
  return `⚡ Alcancei ${score} passos no Modo ${modeName} do ECO!
${recordBanner}Será que você consegue memorizar e reproduzir essa sequência?
👉 Jogue grátis no seu navegador: ${APP_URL}`;
}

export function getWhatsAppShareUrl(text: string): string {
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
}

export function getTwitterShareUrl(text: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

export async function shareContent(title: string, text: string, url: string = APP_URL): Promise<'shared' | 'copied' | 'failed'> {
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url,
      });
      return 'shared';
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') {
        return 'failed';
      }
      // If user cancelled or failed, fall through to clipboard copy
    }
  }

  // Fallback to clipboard
  try {
    const fullText = `${text}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(fullText);
      return 'copied';
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = fullText;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return 'copied';
    }
  } catch {
    return 'failed';
  }
}
