// shared/constants/dnd.ts
export const DND_DATA_TYPES = {
  ASSIGN: 'application/x-bookmark-assign',
  UNASSIGN: 'application/x-bookmark-unassign',
} as const

export type DndDataType = (typeof DND_DATA_TYPES)[keyof typeof DND_DATA_TYPES]
