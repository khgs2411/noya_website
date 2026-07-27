export const managerPath = "manager";

export type ManagerTab =
  | "classes"
  | "pending"
  | "templates"
  | "schedules"
  | "documents"
  | "memberships"
  | "customers"
  | "permissions"
  | "change-requests"
  | "settings";

const managerTabPaths = {
  classes: "classes",
  pending: "pending",
  templates: "templates",
  schedules: "schedules",
  documents: "documents",
  memberships: "memberships",
  customers: "customers",
  permissions: "permissions",
  "change-requests": "change-requests",
  settings: "settings",
} satisfies Record<ManagerTab, string>;

export type ManagerRoute =
  | { kind: "not-manager" }
  | { kind: "manager-root" }
  | { kind: "manager-tab"; tab: ManagerTab }
  | { kind: "invalid-manager-tab" };

function normalizePathname(pathname: string) {
  return pathname.replace(/\/+$/, "") || "/";
}

export function getManagerRoute(pathname: string): ManagerRoute {
  const match = normalizePathname(pathname).match(
    /(?:^|\/)manager(?:\/(.*))?$/,
  );

  if (!match) return { kind: "not-manager" };
  if (!match[1]) return { kind: "manager-root" };

  const tab = Object.entries(managerTabPaths).find(
    ([, path]) => path === match[1],
  )?.[0] as ManagerTab | undefined;

  return tab ? { kind: "manager-tab", tab } : { kind: "invalid-manager-tab" };
}

export function isManagerPath(pathname: string) {
  return getManagerRoute(pathname).kind !== "not-manager";
}

export function getManagerTabPath(tab: ManagerTab) {
  return `${managerPath}/${managerTabPaths[tab]}`;
}

export function getManagerTabPathname(pathname: string, tab: ManagerTab) {
  const match = normalizePathname(pathname).match(/^(.*)\/manager(?:\/.*)?$/);
  if (!match) return getManagerTabPath(tab);

  return `${match[1]}/${getManagerTabPath(tab)}`;
}
