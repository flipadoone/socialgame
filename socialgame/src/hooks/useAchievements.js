import { useCallback, useEffect, useState } from 'react';
import { ACHIEVEMENTS } from '../config/roomConstants';

function readSavedAchievements() {
  try {
    const saved = JSON.parse(localStorage.getItem('habbo_achievements') || '[]');
    return new Set(Array.isArray(saved) ? saved : []);
  } catch {
    return new Set();
  }
}

/** Centraliza desbloqueios, persistência e notificação das conquistas. */
export function useAchievements({ onAudit } = {}) {
  const [unlocked, setUnlocked] = useState(readSavedAchievements);
  const [activeAchievement, setActiveAchievement] = useState(null);

  useEffect(() => {
    localStorage.setItem('habbo_achievements', JSON.stringify([...unlocked]));
  }, [unlocked]);

  const unlock = useCallback((key) => {
    const achievement = ACHIEVEMENTS.find(item => item.key === key);
    if (!achievement || unlocked.has(key)) return;

    setUnlocked(previous => {
      if (previous.has(key)) return previous;
      const next = new Set(previous);
      next.add(key);
      return next;
    });
    setActiveAchievement(achievement);
    onAudit?.('ACHIEVEMENT', `Conquista desbloqueada: ${achievement.title}`);
  }, [unlocked, onAudit]);

  return {
    unlockedAchievements: unlocked,
    activeAchievement,
    setActiveAchievement,
    unlockAchievement: unlock,
  };
}
