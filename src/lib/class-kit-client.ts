import { createClassKitClient } from "@class-kit/react";

const supabaseTarget =
  import.meta.env.VITE_SUPABASE_TARGET === "remote" ? "remote" : "local";

const supabaseUrl =
  supabaseTarget === "remote"
    ? import.meta.env.VITE_REMOTE_SUPABASE_URL
    : import.meta.env.VITE_LOCAL_SUPABASE_URL;

const supabasePublishableKey =
  supabaseTarget === "remote"
    ? import.meta.env.VITE_REMOTE_SUPABASE_PUBLISHABLE_KEY
    : import.meta.env.VITE_LOCAL_SUPABASE_PUBLISHABLE_KEY;

export const classKitClient = createClassKitClient({
  supabaseUrl,
  supabasePublishableKey,
  authStorageKey: "noya-flow-class-kit-auth",
  productKey: import.meta.env.DEV
    ? import.meta.env.VITE_CLASS_KIT_LOCAL_PRODUCT_KEY
    : undefined,
});
