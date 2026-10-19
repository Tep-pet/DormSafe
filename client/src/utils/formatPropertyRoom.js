/** Avoid "Ivory Residences - Room 1104 · 1104" when the label is already in the property name. */
export function formatPropertyRoom(propertyName, roomLabel) {
  if (!propertyName) return roomLabel ? `Room ${roomLabel}` : '';
  if (!roomLabel?.trim()) return propertyName;
  const label = roomLabel.trim();
  if (propertyName.includes(label)) return propertyName;
  return `${propertyName} · Room ${label}`;
}
