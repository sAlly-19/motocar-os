export interface Customer {
  id: string;
  fullName: string;
  document: string;
  clientType: 'individual' | 'legal';
  phone: string;
  zipCode: string;
  street: string;
  streetNumber: string;
  neighborhood: string;
  city: string;
  state: string;
  notes: string;
  photoUri?: string;
  createdAt: string;
  updatedAt: string;
}

export type VehicleCategory = 'motocicleta' | 'carro';

/**
 * Vehicle is a CATALOG entity — a reference model for use in Orders/Parts.
 * It does NOT represent a specific vehicle owned by a customer.
 * The customer's actual plate lives on the Order itself (order.plate).
 */
export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  category?: VehicleCategory;
  /** Sub-type within the category (e.g. 'Sedã', 'Naked'). */
  tipo?: string;
  createdAt: string;
  updatedAt: string;
  /** @deprecated Kept only for backwards compatibility with legacy documents. */
  plate?: string;
  /** @deprecated Kept only for backwards compatibility with legacy documents. */
  customerId?: string;
  /** @deprecated Kept only for backwards compatibility with legacy documents. */
  color?: string;
  /** @deprecated Kept only for backwards compatibility with legacy documents. */
  vin?: string;
  /** @deprecated Kept only for backwards compatibility with legacy documents. */
  photoUri?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  type: 'part' | 'service';
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  /** Optional reference to the Part in stock (only for type === 'part'). Enables auto stock sync. */
  partId?: string;
  /** Days of warranty for this specific item */
  warrantyDays?: number;
}

export type OrderStatus = 'draft' | 'open' | 'in-progress' | 'waiting-approval' | 'ready' | 'finished' | 'cancelled';

export interface Order {
  id: string;
  number: string;
  customerId: string;
  /** Reference to the catalog Vehicle (model). */
  vehicleId: string;
  /** Customer's actual plate — a snapshot on the order (Vehicle is a catalog now). */
  plate: string;
  status: OrderStatus;
  mileage?: number;
  /** Optional target date (YYYY-MM-DD). Used to detect late orders. */
  dueDate?: string;
  /** Optional employee id from useTeamStore. */
  technicianId?: string;
  partsSubtotal: number;
  laborSubtotal: number;
  tax: number;
  discount: number;
  total: number;
  notes?: string;
  /**
   * Optional itemized breakdown. Persisted alongside the order document.
   */
  items?: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export type PartCategory = 'carro' | 'moto';

export interface Part {
  id: string;
  name: string;
  sku: string;
  category: PartCategory | '';
  brand: string;
  costPrice: number;
  sellPrice: number;
  currentStock: number;
  minStock: number;
  location: string;
  models: string[];
  photoUri?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  customerId: string;
  vehicleId: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'waiting' | 'finished' | 'cancelled';
  technicianIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  customerId: string;
  vehicleId: string;
  status: 'draft' | 'sent' | 'approved' | 'expired';
  items: OrderItem[];
  total: number;
  validUntil: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * A user-facing notification. Derived on-the-fly from other domain data.
 * Read/dismissed state is persisted separately (see notification_reads).
 */
export type NotificationType = 'info' | 'warning' | 'urgent';

export interface AppNotification {
  /** Deterministic id (e.g. `lowstock:${partId}`). */
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  /** ISO date/time (typically now — derivable). */
  createdAt: string;
  /** Optional route the "Ver" button should open. */
  actionRoute?: string;
  /** Human label for the action button. */
  actionLabel?: string;
  /** Source entity id (partId / orderId / customerId / appointmentId). */
  sourceId?: string;
}

/**
 * Persisted read/dismissed state for notifications (single global doc).
 */
export interface NotificationReads {
  id: 'global';
  readIds: string[];
  dismissedIds: string[];
  updatedAt: string;
}
