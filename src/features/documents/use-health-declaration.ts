import { useProductContext } from "@class-kit/react";
import { useEffect, useLayoutEffect, useReducer, useRef } from "react";
import { useTranslation } from "react-i18next";

import {
  hasAcceptedHealthDeclaration,
  healthDeclarationAcceptanceVersionKey,
} from "@/features/documents/health-declaration-acceptance";
import { acceptProductDocument } from "@/features/documents/product-document-acceptance";
import {
  productDocumentFallbackLocale,
  productDocumentTypes,
} from "@/features/documents/product-document-types";

type State = {
  status: "idle" | "loading" | "unavailable" | "error" | "unsigned" | "signed";
  version: number | null;
  checked: boolean;
  submitting: boolean;
  error: string | null;
};

type Event =
  | { type: "reset" | "loading" | "unavailable" }
  | { type: "loaded"; version: number; signed: boolean }
  | { type: "loadError" | "signError"; message: string }
  | { type: "checked"; checked: boolean }
  | { type: "signing" }
  | { type: "signed"; version: number };

const initialState: State = {
  status: "idle",
  version: null,
  checked: false,
  submitting: false,
  error: null,
};

function transition(state: State, event: Event): State {
  switch (event.type) {
    case "reset":
      return initialState;
    case "loading":
    case "unavailable":
      return { ...initialState, status: event.type };
    case "loaded":
      return {
        ...initialState,
        status: event.signed ? "signed" : "unsigned",
        version: event.version,
      };
    case "loadError":
      return { ...initialState, status: "error", error: event.message };
    case "checked":
      return state.status === "unsigned" && !state.submitting
        ? { ...state, checked: event.checked, error: null }
        : state;
    case "signing":
      return state.status === "unsigned" && state.checked && !state.submitting
        ? { ...state, submitting: true, error: null }
        : state;
    case "signError":
      return { ...state, submitting: false, error: event.message };
    case "signed":
      return { ...initialState, status: "signed", version: event.version };
  }
}

export function useHealthDeclaration(enabled: boolean) {
  const { client, session } = useProductContext();
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const userId = session?.user.id;
  const [state, dispatch] = useReducer(transition, initialState);
  const context = useRef<object | null>(null);
  const inFlight = useRef<object | null>(null);

  useLayoutEffect(() => {
    context.current = {};
    return () => { context.current = null; };
  }, [client, enabled, locale, userId]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!enabled || !client || !userId) {
        dispatch({ type: "reset" });
        return;
      }

      dispatch({ type: "loading" });
      try {
        const [documentResult, profileResult] = await Promise.all([
          client.productDocuments.get(productDocumentTypes.healthDeclaration, {
            locale,
            fallbackLocale: productDocumentFallbackLocale,
          }),
          client.profile.get(),
        ]);
        if (cancelled) return;

        if (documentResult.error?.code === "not_found") {
          dispatch({ type: "unavailable" });
        } else if (documentResult.error || profileResult.error) {
          dispatch({ type: "loadError", message: t("profile.healthDeclaration.loadError") });
        } else {
          const version = documentResult.data.document.version;
          dispatch({
            type: "loaded",
            version,
            signed: hasAcceptedHealthDeclaration(profileResult.data.user.metadata, version),
          });
        }
      } catch {
        if (!cancelled) {
          dispatch({ type: "loadError", message: t("profile.healthDeclaration.loadError") });
        }
      }
    }

    const timeoutId = window.setTimeout(() => { void load(); }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [client, enabled, locale, t, userId]);

  async function sign() {
    if (
      !enabled || !client || !userId || state.status !== "unsigned" ||
      !state.checked || state.submitting || inFlight.current === context.current
    ) return;

    const attempt = context.current;
    inFlight.current = attempt;
    dispatch({ type: "signing" });
    try {
      const result = await acceptProductDocument(
        client,
        productDocumentTypes.healthDeclaration,
        locale,
        "profile_health_declaration",
      );
      if (context.current !== attempt) return;
      if (result.error) {
        dispatch({ type: "signError", message: t("profile.healthDeclaration.signError") });
        return;
      }

      const version = result.data.acceptance.document_version;
      const profileResult = await client.profile.update({
        metadata: { [healthDeclarationAcceptanceVersionKey]: version },
      });
      if (context.current !== attempt) return;
      if (profileResult.error) {
        dispatch({ type: "signError", message: t("profile.healthDeclaration.signError") });
        return;
      }
      dispatch({ type: "signed", version });
    } catch {
      if (context.current === attempt) {
        dispatch({ type: "signError", message: t("profile.healthDeclaration.signError") });
      }
    } finally {
      if (inFlight.current === attempt) inFlight.current = null;
    }
  }

  return {
    ...state,
    setChecked: (checked: boolean) => dispatch({ type: "checked", checked }),
    sign,
  };
}
