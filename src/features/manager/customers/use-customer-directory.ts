import {
  ClassKitManagerApiError,
  type ClassKitClient,
  type Customer,
  type CustomerStatus,
} from "@class-kit/react";
import { useCallback, useEffect, useRef, useState } from "react";

export type CustomerDirectoryFilter = CustomerStatus | "all";

type CustomerPage = {
  requestCursor: string | null;
  records: Customer[];
  nextCursor: string | null;
};

type LoadStatus = "idle" | "loading" | "loaded" | "error";

export type CustomerDirectoryState = {
  accessChanged: boolean;
  canGoNext: boolean;
  canGoPrevious: boolean;
  clearForForbidden: () => void;
  error: string | null;
  filter: CustomerDirectoryFilter;
  loadStatus: LoadStatus;
  next: () => void;
  previous: () => void;
  records: Customer[];
  reconcile: (customer: Customer) => void;
  refresh: () => void;
  retry: () => void;
  setFilter: (filter: CustomerDirectoryFilter) => void;
};

const PAGE_SIZE = 24;

export function useCustomerDirectory({
  client,
  canReadCustomers,
  onForbidden,
}: {
  client: ClassKitClient | null;
  canReadCustomers: boolean;
  onForbidden: () => void;
}) {
  const [filter, setFilterState] = useState<CustomerDirectoryFilter>("all");
  const [pages, setPages] = useState<CustomerPage[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [accessChanged, setAccessChanged] = useState(false);
  const [failedNextCursor, setFailedNextCursor] = useState<string | null>(null);
  const requestRef = useRef(0);
  const pageIndexRef = useRef(0);

  useEffect(() => {
    pageIndexRef.current = pageIndex;
  }, [pageIndex]);

  const load = useCallback(
    async ({
      cursor,
      replaceCurrent = false,
      reset = false,
      append = false,
    }: {
      cursor: string | null;
      replaceCurrent?: boolean;
      reset?: boolean;
      append?: boolean;
    }) => {
      if (!client || !canReadCustomers) return;

      const requestId = ++requestRef.current;
      if (!append) setFailedNextCursor(null);
      setLoadStatus("loading");
      setError(null);

      try {
        const result = await client.management.customers.list({
          limit: PAGE_SIZE,
          ...(cursor ? { cursor } : {}),
          ...(filter === "all" ? {} : { status: filter }),
        });
        if (requestId !== requestRef.current) return;

        const nextPage: CustomerPage = {
          requestCursor: cursor,
          records: result.customers,
          nextCursor: result.nextCursor,
        };
        setPages((current) => {
          if (reset) return [nextPage];
          if (replaceCurrent) {
            const currentIndex = pageIndexRef.current;
            const currentPage = current[currentIndex];
            const forward = currentPage?.nextCursor === nextPage.nextCursor
              ? current.slice(currentIndex + 1)
              : [];
            return [...current.slice(0, currentIndex), nextPage, ...forward];
          }
          return [...current, nextPage];
        });
        if (reset) setPageIndex(0);
        if (append) setPageIndex((index) => index + 1);
        setFailedNextCursor(null);
        setAccessChanged(false);
        setLoadStatus("loaded");
      } catch (loadError) {
        if (requestId !== requestRef.current) return;
        if (
          loadError instanceof ClassKitManagerApiError &&
          loadError.code === "forbidden"
        ) {
          setPages([]);
          setPageIndex(0);
          setAccessChanged(true);
          onForbidden();
        } else {
          setError("load_failed");
          if (append) setFailedNextCursor(cursor);
        }
        setLoadStatus("error");
      }
    },
    [canReadCustomers, client, filter, onForbidden],
  );

  useEffect(() => {
    requestRef.current += 1;
    let timeoutId: number | null = null;
    if (client && canReadCustomers && !accessChanged) {
      timeoutId = window.setTimeout(() => {
        void load({ cursor: null, reset: true });
      }, 0);
    }
    return () => {
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      requestRef.current += 1;
    };
  }, [accessChanged, canReadCustomers, client, filter, load]);

  const currentPage = pages[pageIndex] ?? null;
  const setFilter = useCallback((nextFilter: CustomerDirectoryFilter) => {
    if (nextFilter === filter) return;
    requestRef.current += 1;
    setPages([]);
    setPageIndex(0);
    setError(null);
    setFailedNextCursor(null);
    setFilterState(nextFilter);
  }, [filter]);

  const next = useCallback(() => {
    if (loadStatus === "loading") return;
    if (pageIndex < pages.length - 1) {
      requestRef.current += 1;
      setPageIndex((index) => index + 1);
      setError(null);
      setFailedNextCursor(null);
      setLoadStatus("loaded");
      return;
    }
    if (!currentPage?.nextCursor) return;
    void load({ cursor: currentPage.nextCursor, append: true });
  }, [currentPage, load, loadStatus, pageIndex, pages.length]);

  const previous = useCallback(() => {
    if (pageIndex === 0 || loadStatus === "loading") return;
    requestRef.current += 1;
    setPageIndex((index) => Math.max(0, index - 1));
    setError(null);
    setFailedNextCursor(null);
    setLoadStatus("loaded");
  }, [loadStatus, pageIndex]);

  const refresh = useCallback(() => {
    if (loadStatus === "loading") return;
    void load({
      cursor: currentPage?.requestCursor ?? null,
      replaceCurrent: pages.length > 0,
      reset: pages.length === 0,
    });
  }, [currentPage, load, loadStatus, pages.length]);

  const retry = useCallback(() => {
    if (failedNextCursor) {
      void load({ cursor: failedNextCursor, append: true });
      return;
    }
    refresh();
  }, [failedNextCursor, load, refresh]);

  const clearForForbidden = useCallback(() => {
    requestRef.current += 1;
    setPages([]);
    setPageIndex(0);
    setError(null);
    setFailedNextCursor(null);
    setAccessChanged(true);
    setLoadStatus("error");
  }, []);

  const reconcile = useCallback((customer: Customer) => {
    setPages((current) => current.slice(0, pageIndexRef.current + 1).map((page) => {
      const containsCustomer = page.records.some(
        (record) => record.customerId === customer.customerId,
      );
      if (!containsCustomer) return page;

      if (filter !== "all" && customer.status !== filter) {
        return {
          ...page,
          records: page.records.filter(
            (record) => record.customerId !== customer.customerId,
          ),
        };
      }

      return {
        ...page,
        records: page.records.map((record) =>
          record.customerId === customer.customerId ? customer : record,
        ),
      };
    }));
  }, [filter]);

  const directory: CustomerDirectoryState = {
    accessChanged: canReadCustomers ? accessChanged : false,
    canGoNext: canReadCustomers && Boolean(currentPage?.nextCursor || pageIndex < pages.length - 1),
    canGoPrevious: canReadCustomers && pageIndex > 0,
    clearForForbidden,
    error: canReadCustomers ? error : null,
    filter,
    loadStatus: canReadCustomers ? loadStatus : "idle",
    next,
    previous,
    records: canReadCustomers ? currentPage?.records ?? [] : [],
    reconcile,
    refresh,
    retry,
    setFilter,
  };

  return directory;
}
