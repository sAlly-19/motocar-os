import { useState, useMemo } from 'react';
import { useDebounce } from '../utils/useDebounce';
import { useAppStore } from '../stores/useAppStore';
import type { OrderStatus } from '../db/schema';

export type OrderFilter = 'all' | OrderStatus;
export type SortOrder = 'newest' | 'oldest' | 'highest' | 'lowest';

export function useOrderFilters() {
  const orders = useAppStore((s) => s.orders);
  const customers = useAppStore((s) => s.customers);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderFilter>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  const debouncedSearch = useDebounce(searchQuery, 300);

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (filterStatus !== 'all') {
      result = result.filter((o) => o.status === filterStatus);
    }

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (o) =>
          o.number.toLowerCase().includes(q) ||
          customers.find((c) => c.id === o.customerId)?.fullName.toLowerCase().includes(q) ||
          (o.plate ?? '').toLowerCase().includes(q),
      );
    }

    result.sort((a, b) => {
      switch (sortOrder) {
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'highest':
          return b.total - a.total;
        case 'lowest':
          return a.total - b.total;
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return result;
  }, [orders, debouncedSearch, filterStatus, sortOrder, customers]);

  return {
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    sortOrder,
    setSortOrder,
    filteredOrders,
  };
}
