"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { InventoryDetailView } from "@/components/inventory/inventory-detail-view";
import { InventoryKpiWidgets } from "@/components/inventory/inventory-kpi-widgets";
import { InventoryListing } from "@/components/inventory/inventory-listing";
import { InventoryPagination } from "@/components/inventory/inventory-pagination";
import { InventoryToolbar } from "@/components/inventory/inventory-toolbar";
import { getInventoryDetail, getInventoryItems } from "@/lib/inventory-api";
import { formatApiError } from "@/lib/format-api-error";
import type { Category } from "@/types/products";
import type { InventoryItem, InventoryKpiData } from "@/types/inventory";

interface InventoryPageClientProps {
  initialItems: InventoryItem[];
  initialKpi: InventoryKpiData;
  initialCategories: Category[];
  initialPage: number;
  initialPageSize: number;
  initialTotal: number;
  initialTotalPages: number;
}

function InventoryPageContent({
  initialItems,
  initialKpi,
  initialCategories,
  initialPage,
  initialPageSize,
  initialTotal,
  initialTotalPages,
}: InventoryPageClientProps) {
  const toast = useToast();
  const didHydrate = useRef(false);
  const latestRequestId = useRef(0);

  const [items, setItems] = useState(initialItems);
  const [kpi, setKpi] = useState(initialKpi);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [page, setPage] = useState(initialPage);
  const [pageSize] = useState(initialPageSize);
  const [total, setTotal] = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const fetchData = useCallback(async () => {
    const requestId = latestRequestId.current + 1;
    latestRequestId.current = requestId;
    setLoading(true);
    try {
      const response = await getInventoryItems({
        search: debouncedSearch || undefined,
        category_id: selectedCategoryId ?? undefined,
        status: selectedStatus ?? undefined,
        page,
        page_size: pageSize,
      });
      if (latestRequestId.current !== requestId) return;
      setItems(response.items);
      setKpi(response.kpi);
      setTotal(response.total);
      setTotalPages(response.total_pages);
    } catch (err) {
      toast.error(formatApiError(err instanceof Error ? err.message : "Failed to load inventory"));
    } finally {
      if (latestRequestId.current === requestId) setLoading(false);
    }
  }, [debouncedSearch, page, pageSize, selectedCategoryId, selectedStatus, toast]);

  useEffect(() => {
    if (!didHydrate.current) {
      didHydrate.current = true;
      return;
    }
    fetchData();
  }, [fetchData]);

  const openDetail = useCallback(async (item: InventoryItem) => {
    setSelectedItem(item);
    setDetailLoading(true);
    try {
      const detail = await getInventoryDetail(item.product_id);
      setSelectedItem(detail.item);
    } catch (err) {
      toast.error(formatApiError(err instanceof Error ? err.message : "Failed to load inventory detail"));
    } finally {
      setDetailLoading(false);
    }
  }, [toast]);

  const handleItemUpdated = useCallback(
    (updated: InventoryItem) => {
      setSelectedItem(updated);
      setItems((current) => current.map((item) => (item.product_id === updated.product_id ? updated : item)));
      fetchData();
    },
    [fetchData]
  );

  const resetToList = useCallback(() => {
    setSelectedItem(null);
    setDetailLoading(false);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleCategoryChange = useCallback((value: number | null) => {
    setSelectedCategoryId(value);
    setPage(1);
  }, []);

  const handleStatusChange = useCallback((value: string | null) => {
    setSelectedStatus(value);
    setPage(1);
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {selectedItem ? (
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <InventoryDetailView
            item={selectedItem}
            loading={detailLoading}
            onBack={resetToList}
            onUpdated={handleItemUpdated}
          />
        </div>
      ) : (
        <>
          <InventoryKpiWidgets kpi={kpi} />
          <InventoryToolbar
            search={search}
            selectedCategoryId={selectedCategoryId}
            selectedStatus={selectedStatus}
            categories={initialCategories}
            viewMode={viewMode}
            onSearchChange={handleSearchChange}
            onCategoryChange={handleCategoryChange}
            onStatusChange={handleStatusChange}
            onViewModeChange={setViewMode}
          />
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <InventoryListing
              items={items}
              loading={loading}
              viewMode={viewMode}
              onItemClick={openDetail}
              selectedItemId={null}
            />
            <InventoryPagination
              page={page}
              pageSize={pageSize}
              total={total}
              totalPages={totalPages}
              loading={loading}
              onPageChange={setPage}
            />
          </div>
        </>
      )}
    </div>
  );
}

export function InventoryPageClient(props: InventoryPageClientProps) {
  return (
    <ToastProvider>
      <InventoryPageContent {...props} />
    </ToastProvider>
  );
}
