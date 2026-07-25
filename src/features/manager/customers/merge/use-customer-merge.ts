import {
  ClassKitManagerApiError,
  isCustomerMergeApiError,
  type ClassKitClient,
  type Customer,
  type CustomerMergeFieldResolutionsInput,
  type CustomerMergePreview,
  type MergeCustomersInput,
} from "@class-kit/react";
import { useCallback, useEffect, useRef, useState } from "react";

export type CustomerMergePhase = "selecting" | "previewing" | "reviewing" | "preview_error" | "confirming" | "merging" | "completion_unknown" | "error";
export type CustomerMergeError = "preview_invalid" | "preview_retry" | "stale" | "concurrent" | "idempotency" | "payload_too_large" | "recipient_strategy" | "failed" | null;

export function useCustomerMerge({
  client,
  source,
  onComplete,
  onAlreadyMerged,
  onMutationForbidden,
}: {
  client: ClassKitClient | null;
  source: Customer;
  onComplete: (survivor: Customer) => void;
  onAlreadyMerged: (survivorCustomerId: string) => void;
  onMutationForbidden: () => void;
}) {
  const [survivorCustomerId, setSurvivorCustomerId] = useState("");
  const [preview, setPreview] = useState<CustomerMergePreview | null>(null);
  const [phase, setPhase] = useState<CustomerMergePhase>("selecting");
  const [error, setError] = useState<CustomerMergeError>(null);
  const [expired, setExpired] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const generationRef = useRef(0);
  const frozenInputRef = useRef<MergeCustomersInput | null>(null);

  const invalidate = useCallback(() => {
    generationRef.current += 1;
    frozenInputRef.current = null;
    setPreview(null);
    setError(null);
    setExpired(false);
  }, []);

  useEffect(() => () => { generationRef.current += 1; }, []);
  useEffect(() => {
    if (!preview) return;
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((new Date(preview.expiresAt).getTime() - Date.now()) / 1_000));
      setRemainingSeconds(remaining);
      setExpired(remaining === 0);
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [preview]);

  const selectSurvivor = useCallback((customerId: string) => {
    if (phase === "merging" || phase === "completion_unknown") return;
    invalidate();
    setSurvivorCustomerId(customerId);
    setPhase("selecting");
  }, [invalidate, phase]);

  const requestPreview = useCallback(async () => {
    if (!client || !survivorCustomerId || phase === "merging" || phase === "completion_unknown") return;
    const generation = ++generationRef.current;
    frozenInputRef.current = null;
    setPreview(null);
    setError(null);
    setExpired(false);
    setPhase("previewing");
    try {
      const result = await client.management.customers.previewMerge({
        sourceCustomerId: source.customerId,
        survivorCustomerId,
      });
      if (generation !== generationRef.current) return;
      setPreview(result.mergePreview);
      setPhase("reviewing");
    } catch (requestError) {
      if (generation !== generationRef.current) return;
      if (requestError instanceof ClassKitManagerApiError && requestError.code === "forbidden") {
        onMutationForbidden();
        return;
      }
      if (isCustomerMergeApiError(requestError)) {
        if (requestError.code === "customer_merged") return onAlreadyMerged(requestError.details.survivorCustomerId);
        if (requestError.code === "merge_preview_stale" || requestError.code === "merge_conflict") {
          setError(requestError.code === "merge_conflict" && requestError.details.reason === "concurrent_activity" ? "concurrent" : "stale");
          setPhase("selecting");
          return;
        }
        if (requestError.code === "merge_recipient_strategy_missing") {
          setError("recipient_strategy");
          setPhase("error");
          return;
        }
      }
      if (requestError instanceof ClassKitManagerApiError && ["bad_request", "not_found", "conflict"].includes(requestError.code)) {
        setError("preview_invalid");
        setPhase("selecting");
      } else {
        setError("preview_retry");
        setPhase("preview_error");
      }
    }
  }, [client, onAlreadyMerged, onMutationForbidden, phase, source.customerId, survivorCustomerId]);

  const confirm = useCallback(() => {
    if (preview && !expired && phase === "reviewing") setPhase("confirming");
  }, [expired, phase, preview]);

  const submit = useCallback(async (fieldResolutions: CustomerMergeFieldResolutionsInput) => {
    if (!client || !preview || expired || phase !== "confirming") return;
    const input: MergeCustomersInput = {
      sourceCustomerId: source.customerId,
      survivorCustomerId,
      previewToken: preview.previewToken,
      idempotencyKey: crypto.randomUUID(),
      fieldResolutions,
    };
    frozenInputRef.current = input;
    const generation = ++generationRef.current;
    setPhase("merging");
    try {
      const result = await client.management.customers.merge(input);
      if (generation !== generationRef.current) return;
      frozenInputRef.current = null;
      onComplete(result.customer);
    } catch (requestError) {
      if (generation !== generationRef.current) return;
      if (requestError instanceof ClassKitManagerApiError && requestError.code === "forbidden") {
        frozenInputRef.current = null;
        onMutationForbidden();
        return;
      }
      if (isCustomerMergeApiError(requestError)) {
        frozenInputRef.current = null;
        if (requestError.code === "customer_merged") return onAlreadyMerged(requestError.details.survivorCustomerId);
        if (requestError.code === "merge_preview_stale") { setError("stale"); setPreview(null); setPhase("selecting"); return; }
        if (requestError.code === "merge_conflict") {
          setError(requestError.details.reason === "payload_too_large" ? "payload_too_large" : requestError.details.reason === "concurrent_activity" ? "concurrent" : "idempotency");
          setPreview(null);
          setPhase(requestError.details.reason === "payload_too_large" ? "error" : "selecting");
          return;
        }
        setError("recipient_strategy");
        setPhase("error");
        return;
      }
      setPhase("completion_unknown");
    }
  }, [client, expired, onAlreadyMerged, onComplete, onMutationForbidden, phase, preview, source.customerId, survivorCustomerId]);

  const retrySameRequest = useCallback(async () => {
    const input = frozenInputRef.current;
    if (!client || !input || phase !== "completion_unknown") return;
    const generation = ++generationRef.current;
    setPhase("merging");
    try {
      const result = await client.management.customers.merge(input);
      if (generation !== generationRef.current) return;
      frozenInputRef.current = null;
      onComplete(result.customer);
    } catch (requestError) {
      if (generation !== generationRef.current) return;
      if (requestError instanceof ClassKitManagerApiError && requestError.code === "forbidden") { frozenInputRef.current = null; onMutationForbidden(); return; }
      if (isCustomerMergeApiError(requestError)) {
        frozenInputRef.current = null;
        if (requestError.code === "customer_merged") { onAlreadyMerged(requestError.details.survivorCustomerId); return; }
        if (requestError.code === "merge_preview_stale") { setError("stale"); setPreview(null); setPhase("selecting"); return; }
        if (requestError.code === "merge_conflict") {
          setError(requestError.details.reason === "payload_too_large" ? "payload_too_large" : requestError.details.reason === "concurrent_activity" ? "concurrent" : "idempotency");
          setPreview(null);
          setPhase(requestError.details.reason === "payload_too_large" ? "error" : "selecting");
          return;
        }
        setError("recipient_strategy");
        setPhase("error");
        return;
      }
      setPhase("completion_unknown");
    }
  }, [client, onAlreadyMerged, onComplete, onMutationForbidden, phase]);

  const close = useCallback(() => {
    if (phase === "merging" || phase === "completion_unknown") return false;
    generationRef.current += 1;
    return true;
  }, [phase]);

  const forceClear = useCallback(() => {
    generationRef.current += 1;
    frozenInputRef.current = null;
    setPreview(null);
    setError(null);
    setPhase("selecting");
  }, []);

  return { survivorCustomerId, setSurvivorCustomerId: selectSurvivor, preview, phase, error, expired, remainingSeconds, requestPreview, confirm, submit, retrySameRequest, close, forceClear };
}
