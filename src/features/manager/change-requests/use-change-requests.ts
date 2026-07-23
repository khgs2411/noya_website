import type {
  ClassKitClient,
  CreateProductChangeRequestInput,
  ProductChangeRequest,
  UpdateProductChangeRequestInput,
} from "@class-kit/react";
import { useCallback, useEffect, useRef, useState } from "react";

type LoadStatus = "idle" | "loading" | "loaded" | "error";
type MutationKind = "create" | "update" | "delete" | "upload" | null;

type ChangeRequestState = {
  requests: ProductChangeRequest[];
  loadStatus: LoadStatus;
  loadError: string | null;
  mutation: MutationKind;
  mutationError: string | null;
};

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function useChangeRequests({
  client,
}: {
  client: ClassKitClient | null;
}) {
  const [state, setState] = useState<ChangeRequestState>({
    requests: [],
    loadStatus: "idle",
    loadError: null,
    mutation: null,
    mutationError: null,
  });
  const requestVersion = useRef(0);

  const load = useCallback(
    async ({ preserve = false } = {}) => {
      if (!client) {
        setState((current) => ({
          ...current,
          loadStatus: "error",
          loadError: "unavailable",
        }));
        return { ok: false as const, requests: [] as ProductChangeRequest[] };
      }

      const version = requestVersion.current + 1;
      requestVersion.current = version;
      setState((current) => ({
        ...current,
        loadStatus:
          preserve && current.requests.length > 0 ? "loaded" : "loading",
        loadError: null,
      }));

      try {
        const { requests } = await client.management.changeRequests.list();
        if (requestVersion.current !== version) {
          return { ok: false as const, requests: [] as ProductChangeRequest[] };
        }

        setState((current) => ({
          ...current,
          requests,
          loadStatus: "loaded",
          loadError: null,
        }));
        return { ok: true as const, requests };
      } catch (error) {
        if (requestVersion.current !== version) {
          return { ok: false as const, requests: [] as ProductChangeRequest[] };
        }

        setState((current) => ({
          ...current,
          loadStatus:
            preserve && current.requests.length > 0 ? "loaded" : "error",
          loadError: errorMessage(error, "load_failed"),
        }));
        return { ok: false as const, requests: [] as ProductChangeRequest[] };
      }
    },
    [client],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const runMutation = useCallback(
    async <T>(kind: Exclude<MutationKind, null>, command: () => Promise<T>) => {
      if (!client || state.mutation) {
        return { ok: false as const, value: null as T | null };
      }

      setState((current) => ({
        ...current,
        mutation: kind,
        mutationError: null,
      }));
      try {
        const value = await command();
        return { ok: true as const, value };
      } catch (error) {
        setState((current) => ({
          ...current,
          mutationError: errorMessage(error, "mutation_failed"),
        }));
        return { ok: false as const, value: null as T | null };
      } finally {
        setState((current) => ({ ...current, mutation: null }));
      }
    },
    [client, state.mutation],
  );

  const reconcileRequest = useCallback((request: ProductChangeRequest) => {
    setState((current) => ({
      ...current,
      requests: current.requests.some((item) => item.id === request.id)
        ? current.requests.map((item) =>
            item.id === request.id ? request : item,
          )
        : [request, ...current.requests],
    }));
  }, []);

  const clearMutationError = useCallback(() => {
    setState((current) => ({ ...current, mutationError: null }));
  }, []);

  const create = useCallback(
    async (input: CreateProductChangeRequestInput) => {
      const result = await runMutation("create", () =>
        client!.management.changeRequests.create(input),
      );
      if (result.ok) reconcileRequest(result.value.request);
      return result.ok
        ? { ok: true as const, request: result.value.request }
        : { ok: false as const, request: null };
    },
    [client, reconcileRequest, runMutation],
  );

  const update = useCallback(
    async (input: UpdateProductChangeRequestInput) => {
      const result = await runMutation("update", () =>
        client!.management.changeRequests.update(input),
      );
      if (result.ok) reconcileRequest(result.value.request);
      return result.ok
        ? { ok: true as const, request: result.value.request }
        : { ok: false as const, request: null };
    },
    [client, reconcileRequest, runMutation],
  );

  const remove = useCallback(
    async (requestId: string) => {
      const result = await runMutation("delete", () =>
        client!.management.changeRequests.delete(requestId),
      );
      if (result.ok) {
        setState((current) => ({
          ...current,
          requests: current.requests.filter(
            (request) => request.id !== requestId,
          ),
        }));
      }
      return { ok: result.ok };
    },
    [client, runMutation],
  );

  const upload = useCallback(
    async (requestId: string, file: File) => {
      if (!client || state.mutation) return { ok: false as const };

      setState((current) => ({
        ...current,
        mutation: "upload",
        mutationError: null,
      }));
      try {
        await client.management.changeRequests.uploadAttachment(requestId, {
          file,
        });
        const refreshed = await load({ preserve: true });
        return refreshed.ok ? { ok: true as const } : { ok: false as const };
      } catch (error) {
        setState((current) => ({
          ...current,
          mutationError: errorMessage(error, "mutation_failed"),
        }));
        return { ok: false as const };
      } finally {
        setState((current) => ({ ...current, mutation: null }));
      }
    },
    [client, load, state.mutation],
  );

  return {
    state,
    actions: {
      load,
      create,
      update,
      remove,
      upload,
      clearMutationError,
    },
  };
}
