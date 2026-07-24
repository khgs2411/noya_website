import type { LocationSnapshot } from "@class-kit/react";

export type LocationDraft = {
  text: string;
  snapshot: LocationSnapshot | null;
  dirty: boolean;
};

type LocationInputKeys<TextKey extends string, SnapshotKey extends string> = {
  text: TextKey;
  snapshot: SnapshotKey;
};

export function createLocationDraft(
  text: string | null | undefined,
  snapshot: LocationSnapshot | null | undefined,
  dirty = false,
): LocationDraft {
  return {
    text: text ?? snapshot?.label ?? "",
    snapshot: snapshot ?? null,
    dirty,
  };
}

export function updateLocationDraftText(
  _draft: LocationDraft,
  text: string,
): LocationDraft {
  return { text, snapshot: null, dirty: true };
}

export function selectLocationDraftSnapshot(
  snapshot: LocationSnapshot,
): LocationDraft {
  return { text: snapshot.label, snapshot, dirty: true };
}

export function serializeLocationDraft<
  TextKey extends string,
  SnapshotKey extends string,
>(
  draft: LocationDraft,
  keys: LocationInputKeys<TextKey, SnapshotKey>,
): Partial<
  Record<TextKey, string | null> & Record<SnapshotKey, LocationSnapshot | null>
> {
  if (!draft.dirty) return {};

  if (draft.snapshot) {
    return {
      [keys.text]: draft.snapshot.label,
      [keys.snapshot]: draft.snapshot,
    } as Partial<
      Record<TextKey, string | null> &
        Record<SnapshotKey, LocationSnapshot | null>
    >;
  }

  const text = draft.text.trim();
  return {
    [keys.text]: text || null,
    [keys.snapshot]: null,
  } as Partial<
    Record<TextKey, string | null> & Record<SnapshotKey, LocationSnapshot | null>
  >;
}
