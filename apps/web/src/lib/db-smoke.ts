import { createPersistedCollection } from '@oakoss/db';
import {
  type Uuid,
  createIdGenerator,
  memoizeAsync,
  systemClock,
} from '@oakoss/shared';

export type SmokeNote = {
  createdAt: number;
  id: Uuid<'smoke-note'>;
  text: string;
};

export const newSmokeNoteId = createIdGenerator<'smoke-note'>(systemClock);

export const getSmokeNotes = memoizeAsync(() =>
  createPersistedCollection<SmokeNote, Uuid<'smoke-note'>>({
    getKey: (note) => note.id,
    id: 'db-smoke-notes',
  }),
);
