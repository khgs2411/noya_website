import { useProductContext } from "@class-kit/react";
import { AlertCircle, Layers3, Loader2, Plus, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { TemplateCard } from "@/features/manager/templates/template-card";
import { TemplateDeactivateDialog } from "@/features/manager/templates/template-deactivate-dialog";
import { TemplateDetailPanel } from "@/features/manager/templates/template-detail-panel";
import { TemplateFormDialog } from "@/features/manager/templates/template-form-dialog";
import { useManagedTemplates } from "@/features/manager/templates/use-managed-templates";

type TemplateManagementTabProps = {
  canManageTemplates: boolean;
};

type FormSurface =
  | { mode: "create"; templateId?: never }
  | { mode: "edit"; templateId: string }
  | null;

export function TemplateManagementTab({
  canManageTemplates,
}: TemplateManagementTabProps) {
  const { t } = useTranslation();
  const { client } = useProductContext();
  const [formSurface, setFormSurface] = useState<FormSurface>(null);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const managedTemplates = useManagedTemplates({ client, canManageTemplates });
  const { state, actions } = managedTemplates;
  const formTemplate =
    formSurface?.mode === "edit"
      ? state.templates.find((template) => template.id === formSurface.templateId) ??
        state.selectedTemplate
      : null;

  return (
    <section className="rounded-[1.4rem] border border-blush/24 bg-card/78 p-5 shadow-soft sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-blush-strong text-background">
          <Layers3 className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="font-serif text-xs uppercase tracking-[0.25em] text-foreground/48">
            {t("manager.tabs.templates")}
          </p>
          <h2 className="mt-2 font-serif text-3xl text-foreground">
            {t("manager.templates.title")}
          </h2>
          <p className="mt-3 max-w-prose text-sm leading-6 text-foreground/68">
            {canManageTemplates
              ? t("manager.templates.body")
              : t("manager.templates.noAccessBody")}
          </p>
        </div>
      </div>

      {canManageTemplates ? (
        <div className="mt-5 flex flex-col gap-4">
          <div className="flex justify-end">
            <Button
              type="button"
              className="rounded-full"
              onClick={() => setFormSurface({ mode: "create" })}
            >
              <Plus className="size-4" aria-hidden="true" />
              {t("manager.templateActions.create")}
            </Button>
          </div>

          {state.loadStatus === "loading" && (
            <div className="rounded-xl border border-blush/24 bg-background/46 p-5">
              <div className="flex items-center gap-3 text-sm text-foreground/68">
                <Loader2
                  className="size-4 shrink-0 animate-spin text-blush-strong"
                  aria-hidden="true"
                />
                {t("manager.templates.loading")}
              </div>
            </div>
          )}

          {state.loadStatus === "error" && (
            <div className="rounded-xl border border-blush/24 bg-background/46 p-5">
              <div className="flex items-start gap-3">
                <AlertCircle
                  className="mt-0.5 size-5 shrink-0 text-blush-strong"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="font-serif text-xl text-foreground">
                    {t("manager.templates.errorTitle")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-foreground/68">
                    {state.errorMessage ?? t("manager.templates.errorBody")}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4 rounded-full"
                    onClick={() => void actions.refreshTemplates()}
                  >
                    <RefreshCw className="size-4" aria-hidden="true" />
                    {t("manager.templates.retry")}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {state.operationError && (
            <p className="rounded-xl border border-blush/24 bg-background/46 p-3 text-sm leading-6 text-blush-strong">
              {state.operationError}
            </p>
          )}

          {state.loadStatus === "loaded" && state.sortedTemplates.length === 0 && (
            <div className="rounded-xl border border-blush/24 bg-background/46 p-5">
              <p className="font-serif text-xl text-foreground">
                {t("manager.templates.emptyTitle")}
              </p>
              <p className="mt-2 text-sm leading-6 text-foreground/68">
                {t("manager.templates.emptyBody")}
              </p>
            </div>
          )}

          {state.loadStatus === "loaded" && state.sortedTemplates.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {state.sortedTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isSelected={template.id === state.selectedTemplateId}
                  onSelect={actions.selectTemplate}
                />
              ))}
            </div>
          )}

          <TemplateDetailPanel
            template={state.selectedTemplate}
            onClose={actions.clearSelection}
            onEdit={() => {
              if (!state.selectedTemplate) return;
              setFormSurface({
                mode: "edit",
                templateId: state.selectedTemplate.id,
              });
              actions.clearSelection();
            }}
            onDeactivate={() => setDeactivateOpen(true)}
          />

          <TemplateFormDialog
            open={formSurface !== null}
            mode={formSurface?.mode ?? "create"}
            template={formTemplate}
            submitting={
              state.mutationStatus === "creating" ||
              state.mutationStatus === "updating"
            }
            errorMessage={state.operationError}
            onClose={() => setFormSurface(null)}
            onCreate={actions.createTemplate}
            onUpdate={actions.updateTemplate}
          />

          <TemplateDeactivateDialog
            open={deactivateOpen}
            template={state.selectedTemplate}
            submitting={state.mutationStatus === "deactivating"}
            errorMessage={state.operationError}
            onClose={() => setDeactivateOpen(false)}
            onConfirm={actions.deactivateTemplate}
          />
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-blush/24 bg-background/46 p-5">
          <p className="font-serif text-xl text-foreground">
            {t("manager.templates.noAccessTitle")}
          </p>
          <p className="mt-2 text-sm leading-6 text-foreground/68">
            {t("manager.templates.noAccessBody")}
          </p>
        </div>
      )}
    </section>
  );
}
