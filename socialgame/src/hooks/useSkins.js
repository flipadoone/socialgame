import { useCallback, useEffect, useMemo, useState } from 'react';
import { DEFAULT_SKIN_ID, MAX_CUSTOM_SKINS, SKIN_PRESETS, normalizeSkin } from '../config/skins';
import {
  buildSkinFromFiles, loadCustomSkins, loadSelectedSkinId, saveCustomSkins, saveSelectedSkinId,
} from '../services/skinStorage';

/** Skins do jogador: presets + personalizadas (por usuário), com seleção persistente. */
export function useSkins(userId) {
  const [customSkins, setCustomSkins] = useState(() => loadCustomSkins(userId));
  const [selectedId, setSelectedId] = useState(() => loadSelectedSkinId(userId));

  const allSkins = useMemo(() => [...SKIN_PRESETS, ...customSkins], [customSkins]);
  const currentSkin = useMemo(
    () => normalizeSkin(allSkins.find(skin => skin.id === selectedId) ?? { id: DEFAULT_SKIN_ID }),
    [allSkins, selectedId],
  );

  useEffect(() => { saveSelectedSkinId(userId, currentSkin.id); }, [userId, currentSkin.id]);

  const selectSkin = useCallback(id => setSelectedId(id), []);

  const addSkin = useCallback(async (files, name) => {
    if (customSkins.length >= MAX_CUSTOM_SKINS) {
      throw new Error(`Limite de ${MAX_CUSTOM_SKINS} skins próprias. Remova alguma para adicionar outra.`);
    }
    const skin = await buildSkinFromFiles(files, name);
    const next = [...customSkins, skin];
    if (!saveCustomSkins(userId, next)) {
      throw new Error('Não há espaço no navegador para salvar essa skin. Remova outras skins e tente de novo.');
    }
    setCustomSkins(next);
    setSelectedId(skin.id);
    return skin;
  }, [customSkins, userId]);

  const removeSkin = useCallback(id => {
    const next = customSkins.filter(skin => skin.id !== id);
    saveCustomSkins(userId, next);
    setCustomSkins(next);
    setSelectedId(current => (current === id ? DEFAULT_SKIN_ID : current));
  }, [customSkins, userId]);

  return { allSkins, currentSkin, selectSkin, addSkin, removeSkin, maxCustom: MAX_CUSTOM_SKINS, customCount: customSkins.length };
}
