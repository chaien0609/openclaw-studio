export type ArchivedItem = { archivedAt: number | null };

export const filterArchivedItems = <T extends ArchivedItem>(
  items: T[],
  showArchived: boolean
): T[] => {
  if (showArchived) return items;
  return items.filter((item) => !item.archivedAt);
};
