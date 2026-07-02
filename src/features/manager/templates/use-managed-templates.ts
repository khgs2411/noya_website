import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  ClassKitClient,
  ClassTemplate,
  CreateClassTemplateInput,
  UpdateClassTemplateInput,
} from "@class-kit/react";
import { useTranslation } from "react-i18next";

type LoadStatus = "idle" | "loading" | "loaded" | "error";
type MutationStatus = "idle" | "creating" | "updating" | "deactivating";

type UseManagedTemplatesInput = {
  client: ClassKitClient | null;
  canManageTemplates: boolean;
};

export function useManagedTemplates({
  client,
  canManageTemplates,
}: UseManagedTemplatesInput) {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<ClassTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [mutationStatus, setMutationStatus] =
    useState<MutationStatus>("idle");

  const sortedTemplates = useMemo(
    () =>
      [...templates].sort((a, b) => {
        if (a.status !== b.status) return a.status === "active" ? -1 : 1;
        return a.name.localeCompare(b.name);
      }),
    [templates],
  );
  const activeTemplates = useMemo(
    () => sortedTemplates.filter((template) => template.status === "active"),
    [sortedTemplates],
  );
  const selectedTemplate = useMemo(
    () =>
      templates.find((template) => template.id === selectedTemplateId) ?? null,
    [selectedTemplateId, templates],
  );

  const mergeTemplate = useCallback((template: ClassTemplate) => {
    setTemplates((current) => {
      const existing = current.some((item) => item.id === template.id);
      if (!existing) return [...current, template];

      return current.map((item) => (item.id === template.id ? template : item));
    });
  }, []);

  const refreshTemplates = useCallback(async (options?: { silent?: boolean }) => {
    if (!client || !canManageTemplates) {
      setTemplates([]);
      setLoadStatus("idle");
      setErrorMessage(null);
      return;
    }

    if (!options?.silent) {
      setLoadStatus("loading");
      setErrorMessage(null);
    }

    try {
      const result = await client.management.templates.list();
      setTemplates(result.templates);
      setLoadStatus("loaded");
    } catch (error) {
      if (options?.silent) return;

      setErrorMessage(
        error instanceof Error ? error.message : t("manager.templates.errorBody"),
      );
      setLoadStatus("error");
    }
  }, [canManageTemplates, client, t]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshTemplates();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [refreshTemplates]);

  const performMutation = useCallback(
    async <T,>(status: MutationStatus, command: () => Promise<T>) => {
      if (mutationStatus !== "idle") return { ok: false as const };

      setOperationError(null);

      if (!client || !canManageTemplates) {
        setOperationError(t("manager.templateActions.notAvailable"));
        return { ok: false as const };
      }

      setMutationStatus(status);

      try {
        const result = await command();
        if (
          result &&
          typeof result === "object" &&
          "template" in result &&
          result.template &&
          typeof result.template === "object"
        ) {
          mergeTemplate(result.template as ClassTemplate);
        }
        void refreshTemplates({ silent: true });
        return { ok: true as const, result };
      } catch (error) {
        setOperationError(
          error instanceof Error
            ? error.message
            : t("manager.templateActions.actionFailed"),
        );
        return { ok: false as const };
      } finally {
        setMutationStatus("idle");
      }
    },
    [canManageTemplates, client, mergeTemplate, mutationStatus, refreshTemplates, t],
  );

  const createTemplate = useCallback(
    (input: CreateClassTemplateInput) =>
      performMutation("creating", () =>
        client ? client.management.templates.create(input) : Promise.resolve(null),
      ),
    [client, performMutation],
  );

  const updateTemplate = useCallback(
    (input: UpdateClassTemplateInput) =>
      performMutation("updating", () =>
        client ? client.management.templates.update(input) : Promise.resolve(null),
      ),
    [client, performMutation],
  );

  const deactivateTemplate = useCallback(
    (templateId: string) =>
      performMutation("deactivating", () =>
        client
          ? client.management.templates.deactivate(templateId)
          : Promise.resolve(null),
      ),
    [client, performMutation],
  );

  return {
    state: {
      templates,
      sortedTemplates,
      activeTemplates,
      selectedTemplate,
      selectedTemplateId,
      loadStatus,
      errorMessage,
      operationError,
      mutationStatus,
      canManageTemplates,
    },
    actions: {
      refreshTemplates,
      selectTemplate: setSelectedTemplateId,
      clearSelection: () => setSelectedTemplateId(null),
      createTemplate,
      updateTemplate,
      deactivateTemplate,
    },
  };
}
