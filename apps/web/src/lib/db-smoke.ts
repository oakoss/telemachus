import { createPersistedCollection } from '@oakoss/db';
import { type Uuid, createIdGenerator, systemClock } from '@oakoss/shared';

export type SmokeNote = {
  createdAt: number;
  id: Uuid<'smoke-note'>;
  text: string;
};

export const newSmokeNoteId = createIdGenerator<'smoke-note'>(systemClock);

// Once-per-tab open, awaited by the route loader. A rejected open is un-cached
// so the next navigation retries instead of wedging the tab.
let collectionPromise: null | ReturnType<
  typeof createPersistedCollection<SmokeNote, Uuid<'smoke-note'>>
> = null;

export const getSmokeNotes = () =>
  (collectionPromise ??= createPersistedCollection<
    SmokeNote,
    Uuid<'smoke-note'>
  >({ getKey: (note) => note.id, id: 'db-smoke-notes' }).catch(
    (error: unknown) => {
      collectionPromise = null;
      throw error;
    },
  ));
