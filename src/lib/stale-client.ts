type ReloadVersions = {
  current: string;
  remote?: unknown;
  alreadyReloadedFor: string | null;
};

export function shouldReload({ current, remote, alreadyReloadedFor }: ReloadVersions): boolean {
  return typeof remote === "string" && remote.length > 0 &&
    remote !== current && remote !== alreadyReloadedFor;
}
