type ChangeRequestStatusPresentation = {
  cardClassName: string;
  badgeClassName: string;
};

const statusPresentations: Record<string, ChangeRequestStatusPresentation> = {
  open: {
    cardClassName:
      "border-status-open/60 bg-status-open/10 hover:border-status-open hover:bg-status-open/16",
    badgeClassName: "border-status-open/60 bg-status-open/16 text-status-open",
  },
  in_progress: {
    cardClassName:
      "border-status-in-progress/60 bg-status-in-progress/10 hover:border-status-in-progress hover:bg-status-in-progress/16",
    badgeClassName:
      "border-status-in-progress/60 bg-status-in-progress/16 text-status-in-progress",
  },
  done: {
    cardClassName:
      "border-status-done/60 bg-status-done/10 hover:border-status-done hover:bg-status-done/16",
    badgeClassName: "border-status-done/60 bg-status-done/16 text-status-done",
  },
  closed: {
    cardClassName:
      "border-status-closed/60 bg-status-closed/10 hover:border-status-closed hover:bg-status-closed/16",
    badgeClassName:
      "border-status-closed/60 bg-status-closed/16 text-status-closed",
  },
};

const unknownStatusPresentation: ChangeRequestStatusPresentation = {
  cardClassName:
    "border-status-unknown/60 bg-status-unknown/10 hover:border-status-unknown hover:bg-status-unknown/16",
  badgeClassName:
    "border-status-unknown/60 bg-status-unknown/16 text-status-unknown",
};

export function getChangeRequestStatusPresentation(status: string) {
  return statusPresentations[status] ?? unknownStatusPresentation;
}
