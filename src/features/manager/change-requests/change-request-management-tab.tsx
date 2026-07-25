import { useProductContext } from "@class-kit/react";
import { AlertCircle, FileText, Loader2, Plus, RefreshCw } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { ChangeRequestDetailPanel } from "@/features/manager/change-requests/change-request-detail-panel";
import { ChangeRequestFormDialog } from "@/features/manager/change-requests/change-request-form-dialog";
import { useChangeRequests } from "@/features/manager/change-requests/use-change-requests";
import { captureActiveElement, restoreFocus } from "@/lib/focus";

type FormSurface = "create" | "revise" | null;
type ChangeRequestStatusGroup = "in_progress" | "open" | "completed";

const changeRequestStatusGroups: ChangeRequestStatusGroup[] = [
  "in_progress",
  "open",
  "completed",
];

function getChangeRequestStatusGroup(status: string): ChangeRequestStatusGroup {
  if (status === "in_progress") return "in_progress";
  if (status === "open") return "open";
  return "completed";
}

export function ChangeRequestManagementTab({
  canManageChangeRequests,
}: {
  canManageChangeRequests: boolean;
}) {
  if (!canManageChangeRequests) {
    return <ChangeRequestDenied />;
  }

  return <AuthorizedChangeRequestManagementTab />;
}

function ChangeRequestDenied() {
  const { t } = useTranslation();
  return (
    <section className="rounded-[1.4rem] border border-blush/24 bg-card/78 p-5 shadow-soft">
      <h2 className="font-serif text-2xl">
        {t("manager.changeRequests.deniedTitle")}
      </h2>
      <p className="mt-2 text-sm leading-6 text-foreground/68">
        {t("manager.changeRequests.deniedBody")}
      </p>
    </section>
  );
}

function AuthorizedChangeRequestManagementTab() {
  const { t, i18n } = useTranslation();
  const { client } = useProductContext();
  const { state, actions } = useChangeRequests({ client });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formSurface, setFormSurface] = useState<FormSurface>(null);
  const detailFocusReturn = useRef<HTMLElement | null>(null);
  const formFocusReturn = useRef<HTMLElement | null>(null);
  const selectedRequest = useMemo(
    () => state.requests.find((request) => request.id === selectedId) ?? null,
    [selectedId, state.requests],
  );
  const requestsByStatus = useMemo(
    () =>
      changeRequestStatusGroups.map((status) => ({
        status,
        requests: state.requests.filter(
          (request) => getChangeRequestStatusGroup(request.status) === status,
        ),
      })),
    [state.requests],
  );
  const busy = state.mutation !== null;

  function openDetail(id: string) {
    actions.clearMutationError();
    detailFocusReturn.current = captureActiveElement();
    setSelectedId(id);
  }
  function closeDetail() {
    setSelectedId(null);
    restoreFocus(detailFocusReturn.current);
  }
  function openForm(surface: FormSurface) {
    actions.clearMutationError();
    formFocusReturn.current =
      surface === "create" ? captureActiveElement() : null;
    setFormSurface(surface);
  }
  function closeForm() {
    setFormSurface(null);
    if (formSurface !== "revise") restoreFocus(formFocusReturn.current);
  }
  async function create(
    input: Parameters<typeof actions.create>[0],
    image: File | null,
  ) {
    const result = await actions.create(input);
    if (result.ok) {
      setSelectedId(result.request.id);
      if (image) await actions.upload(result.request.id, image);
    }
    return result;
  }

  if (state.loadStatus === "loading" || state.loadStatus === "idle") {
    return (
      <section className="rounded-[1.4rem] border border-blush/24 bg-card/78 p-5 shadow-soft">
        <div className="flex items-center gap-3 text-sm text-foreground/68">
          <Loader2
            className="size-4 animate-spin text-blush-strong"
            aria-hidden="true"
          />
          {t("manager.changeRequests.loading")}
        </div>
      </section>
    );
  }

  if (state.loadStatus === "error" && state.requests.length === 0) {
    return (
      <section className="rounded-[1.4rem] border border-blush/24 bg-card/78 p-5 shadow-soft">
        <AlertCircle className="size-5 text-blush-strong" aria-hidden="true" />
        <h2 className="mt-3 font-serif text-2xl">
          {state.loadError === "unavailable"
            ? t("manager.changeRequests.unavailableTitle")
            : t("manager.changeRequests.errorTitle")}
        </h2>
        <p className="mt-2 text-sm leading-6 text-foreground/68">
          {state.loadError === "unavailable"
            ? t("manager.changeRequests.unavailableBody")
            : t("manager.changeRequests.errorBody")}
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-4 rounded-full"
          onClick={() => void actions.load()}
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          {t("manager.changeRequests.retry")}
        </Button>
      </section>
    );
  }

  return (
    <section className="rounded-[1.4rem] border border-blush/24 bg-card/78 p-4 shadow-soft sm:p-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-serif text-xs uppercase tracking-[0.25em] text-foreground/48">
            {t("manager.changeRequests.eyebrow")}
          </p>
          <h2 className="mt-2 font-serif text-3xl">
            {t("manager.changeRequests.title")}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground/68">
            {t("manager.changeRequests.body")}
          </p>
        </div>
        <Button
          type="button"
          className="rounded-full"
          disabled={busy}
          onClick={() => openForm("create")}
        >
          <Plus className="size-4" aria-hidden="true" />
          {t("manager.changeRequests.actions.create")}
        </Button>
      </header>
      {state.loadError && (
        <p className="mt-4 rounded-xl border border-blush-strong/35 bg-background/46 p-3 text-sm text-blush-strong">
          {t("manager.changeRequests.refreshFailed")}
        </p>
      )}
      {state.requests.length === 0 ? (
        <div className="mt-5 rounded-xl border border-blush/24 bg-background/46 p-5">
          <FileText className="size-5 text-blush-strong" aria-hidden="true" />
          <h3 className="mt-3 font-serif text-xl">
            {t("manager.changeRequests.emptyTitle")}
          </h3>
          <p className="mt-1 text-sm leading-6 text-foreground/68">
            {t("manager.changeRequests.emptyBody")}
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-6">
          {requestsByStatus.map(
            ({ status: statusGroup, requests }) =>
              requests.length > 0 && (
                <section
                  key={statusGroup}
                  aria-labelledby={`change-request-status-${statusGroup}`}
                >
                  <h3
                    id={`change-request-status-${statusGroup}`}
                    className="font-serif text-2xl"
                  >
                    {t(`manager.changeRequests.groups.${statusGroup}`)}
                  </h3>
                  <div className="mt-3 grid gap-3">
                    {requests.map((request) => {
                      const type =
                        request.type === "issue"
                          ? t("manager.changeRequests.type.issue")
                          : request.type === "feature_request"
                            ? t("manager.changeRequests.type.featureRequest")
                            : String(request.type);
                      const status =
                        request.status === "open" ||
                        request.status === "in_progress" ||
                        request.status === "done" ||
                        request.status === "closed"
                          ? t(`manager.changeRequests.status.${request.status}`)
                          : String(request.status);
                      return (
                        <button
                          key={request.id}
                          type="button"
                          className="w-full rounded-xl border border-blush/24 bg-background/46 p-4 text-start transition-colors hover:border-blush-strong/55"
                          onClick={() => openDetail(request.id)}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <h4 className="break-words font-serif text-xl">
                              {request.title ??
                                t("manager.changeRequests.untitled")}
                            </h4>
                            <span className="rounded-full border border-blush/24 px-2 py-1 text-xs text-foreground/68">
                              {status}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-foreground/68">
                            {type} ·{" "}
                            {new Intl.DateTimeFormat(i18n.language, {
                              dateStyle: "medium",
                            }).format(new Date(request.created_at))}
                          </p>
                          <p className="mt-2 line-clamp-2 whitespace-pre-wrap break-words text-sm text-foreground/72">
                            {request.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ),
          )}
        </div>
      )}
      {selectedRequest && formSurface !== "revise" && (
        <ChangeRequestDetailPanel
          request={selectedRequest}
          busy={busy}
          errorMessage={
            state.mutationError
              ? t("manager.changeRequests.actionFailed")
              : null
          }
          refreshFailed={state.loadError !== null}
          onClose={closeDetail}
          onRevise={() => openForm("revise")}
          onDelete={() => actions.remove(selectedRequest.id)}
          onUpload={(file) => actions.upload(selectedRequest.id, file)}
          onRetryRefresh={() => actions.load({ preserve: true })}
        />
      )}
      {formSurface && (
        <ChangeRequestFormDialog
          mode={formSurface}
          request={formSurface === "revise" ? selectedRequest : null}
          busy={busy}
          errorMessage={
            state.mutationError
              ? t("manager.changeRequests.actionFailed")
              : null
          }
          onClose={closeForm}
          onCreate={create}
          onRevise={actions.update}
        />
      )}
    </section>
  );
}
