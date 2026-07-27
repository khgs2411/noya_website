import { isManagerPath, managerPath } from "@/features/manager/manager-routes";

const assetBase = import.meta.env.BASE_URL;

export const lessonsPath = "lessons";
export const authPath = "auth";
export const profilePath = "profile";
export { isManagerPath, managerPath };
export const termsPath = "terms";
export const healthDeclarationPath = "health-declaration";

export const images = {
  hero: `${assetBase}images/9D661F78-FE6E-4ECF-960D-8FE8C888CB91.jpg`,
  portrait: `${assetBase}images/976EFAC9-76C5-4B1A-AD92-F6A051E7CC31.jpg`,
  leap: `${assetBase}images/IMG_2109.jpg`,
  leapWide: `${assetBase}images/IMG_2101.jpg`,
  private: `${assetBase}images/נולדהלרקוד.jpg`,
  rehearsal: `${assetBase}images/3f126190-c261-48b2-9c94-d6c20c94365b.jpg`,
  group: `${assetBase}images/750f785f-80db-4158-825b-c5f7ff958837.jpg`,
  ballet: `${assetBase}images/IMG_2105.jpg`,
};

export const featuredClasses = [
  {
    date: "24",
    title: "classes.flow",
    time: "classes.flowTime",
    image: images.leap,
  },
  {
    date: "27",
    title: "classes.lines",
    time: "classes.linesTime",
    image: images.rehearsal,
  },
  {
    date: "29",
    title: "classes.jazz",
    time: "classes.jazzTime",
    image: images.group,
  },
];

export const galleryImages = [
  images.hero,
  images.portrait,
  images.leap,
  images.private,
  images.group,
  images.rehearsal,
  images.ballet,
];

export function isLessonsPath(pathname: string) {
  return pathname.replace(/\/+$/, "").endsWith("/lessons");
}

export function isAuthPath(pathname: string) {
  return pathname.replace(/\/+$/, "").endsWith("/auth");
}

export function isProfilePath(pathname: string) {
  return pathname.replace(/\/+$/, "").endsWith("/profile");
}

export function isTermsPath(pathname: string) {
  return pathname.replace(/\/+$/, "").endsWith("/terms");
}

export function isHealthDeclarationPath(pathname: string) {
  return pathname.replace(/\/+$/, "").endsWith("/health-declaration");
}
