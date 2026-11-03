export function handleObjectInteraction(objectId, { setModal, isRoot }) {
  if (!isRoot) return false;
  setModal?.(objectId);
  return true;
}
