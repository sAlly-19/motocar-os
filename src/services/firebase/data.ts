import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore';
import type {
  Appointment,
  Budget,
  Customer,
  NotificationReads,
  Order,
  OrderStatus,
  Part,
  Vehicle,
} from '../../db/schema';
import { getFirebaseDb } from './client';
import type { Employee } from '../../stores/useTeamStore';

type CollectionName =
  | 'customers'
  | 'vehicles'
  | 'orders'
  | 'parts'
  | 'appointments'
  | 'budgets'
  | 'employees'
  | 'notification_reads';

export interface AppData {
  customers: Customer[];
  vehicles: Vehicle[];
  orders: Order[];
  parts: Part[];
  appointments: Appointment[];
  budgets: Budget[];
}

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) return value.map(stripUndefined) as T;
  if (!value || typeof value !== 'object') return value;
  const output: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (val !== undefined) output[key] = stripUndefined(val);
  }
  return output as T;
}

function collectionRef(name: CollectionName) {
  return collection(getFirebaseDb(), name);
}

function documentRef(name: CollectionName, id: string) {
  return doc(getFirebaseDb(), name, id);
}

function withId<T extends { id: string }>(data: DocumentData, id: string): T {
  return { ...data, id } as T;
}

function sortByCreatedAtDesc<T extends { createdAt?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')));
}

function sortParts(items: Part[]): Part[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
}

function normalizePart(part: Part): Part {
  // Backwards-compat: legacy documents used `supplier` before the rename to `brand`.
  const legacySupplier = (part as any).supplier as string | undefined;
  return {
    ...part,
    models: part.models ?? [],
    brand: part.brand ?? legacySupplier ?? '',
    category: part.category ?? '',
  };
}

function normalizeAppointment(appointment: Appointment): Appointment {
  return { ...appointment, technicianIds: appointment.technicianIds ?? [] };
}

function normalizeBudget(budget: Budget): Budget {
  return { ...budget, items: budget.items ?? [] };
}

/**
 * Vehicle is now a catalog entity. Legacy documents may still carry
 * `plate`, `customerId`, `color`, `vin`, `photoUri` — we keep them
 * on the object (schema marks them deprecated) but they are not part
 * of the working data model anymore.
 */
function normalizeVehicle(vehicle: Vehicle): Vehicle {
  return {
    ...vehicle,
    category: vehicle.category ?? undefined,
    tipo: vehicle.tipo ?? '',
  };
}

/**
 * Backwards-compat for orders that predate `order.plate`. Legacy orders
 * relied on a lookup via `vehicleId → vehicle.plate`; that lookup no longer
 * exists on the client (vehicles are catalog-only), so we fall back to '' here.
 */
function normalizeOrder(order: Order): Order {
  return {
    ...order,
    plate: order.plate ?? '',
    items: order.items ?? undefined,
  };
}

async function getAll<T extends { id: string }>(name: CollectionName): Promise<T[]> {
  const snapshot = await getDocs(collectionRef(name));
  return snapshot.docs.map((item) => withId<T>(item.data(), item.id));
}

async function setEntity<T extends { id: string }>(name: CollectionName, entity: T): Promise<void> {
  await setDoc(documentRef(name, entity.id), stripUndefined(entity));
}

async function updateEntity(name: CollectionName, id: string, patch: Record<string, unknown>): Promise<void> {
  await updateDoc(documentRef(name, id), stripUndefined({ ...patch, updatedAt: new Date().toISOString() }));
}

export async function getAllData(): Promise<AppData> {
  const [customers, vehicles, orders, parts, appointments, budgets] = await Promise.all([
    getAllCustomers(),
    getAllVehicles(),
    getAllOrders(),
    getAllParts(),
    getAllAppointments(),
    getAllBudgets(),
  ]);
  return { customers, vehicles, orders, parts, appointments, budgets };
}

export async function getAllCustomers(): Promise<Customer[]> {
  return sortByCreatedAtDesc(await getAll<Customer>('customers'));
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const snapshot = await getDoc(documentRef('customers', id));
  return snapshot.exists() ? withId<Customer>(snapshot.data(), snapshot.id) : null;
}

export async function insertCustomer(customer: Customer): Promise<void> {
  await setEntity('customers', customer);
}

export async function updateCustomer(id: string, patch: Partial<Customer>): Promise<void> {
  await updateEntity('customers', id, patch);
}

export async function deleteCustomer(id: string): Promise<void> {
  await deleteDoc(documentRef('customers', id));
}

export async function getAllVehicles(): Promise<Vehicle[]> {
  return sortByCreatedAtDesc((await getAll<Vehicle>('vehicles')).map(normalizeVehicle));
}

export async function insertVehicle(vehicle: Vehicle): Promise<void> {
  await setEntity('vehicles', normalizeVehicle(vehicle));
}

export async function updateVehicle(id: string, patch: Partial<Vehicle>): Promise<void> {
  await updateEntity('vehicles', id, patch);
}

export async function deleteVehicle(id: string): Promise<void> {
  await deleteDoc(documentRef('vehicles', id));
}

export async function getAllOrders(): Promise<Order[]> {
  return sortByCreatedAtDesc((await getAll<Order>('orders')).map(normalizeOrder));
}

export async function getOrderById(id: string): Promise<Order | null> {
  const snapshot = await getDoc(documentRef('orders', id));
  return snapshot.exists() ? normalizeOrder(withId<Order>(snapshot.data(), snapshot.id)) : null;
}

export async function insertOrder(order: Order): Promise<void> {
  await setEntity('orders', normalizeOrder(order));
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  await updateEntity('orders', id, { status });
}

export async function updateOrderFields(
  id: string,
  fields: Partial<Pick<Order, 'status' | 'notes' | 'mileage' | 'plate' | 'dueDate' | 'technicianId' | 'items'>>,
): Promise<void> {
  await updateEntity('orders', id, fields);
}

export async function deleteOrder(id: string): Promise<void> {
  await deleteDoc(documentRef('orders', id));
}

export async function getAllParts(): Promise<Part[]> {
  return sortParts((await getAll<Part>('parts')).map(normalizePart));
}

export async function insertPart(part: Part): Promise<void> {
  await setEntity('parts', normalizePart(part));
}

export async function updatePartStock(id: string, qty: number): Promise<void> {
  await updateEntity('parts', id, { currentStock: qty });
}

export async function updatePart(id: string, patch: Partial<Part>): Promise<void> {
  await updateEntity('parts', id, patch);
}

export async function deletePart(id: string): Promise<void> {
  await deleteDoc(documentRef('parts', id));
}

export async function getAllAppointments(): Promise<Appointment[]> {
  const appointments = (await getAll<Appointment>('appointments')).map(normalizeAppointment);
  return [...appointments].sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));
}

export async function insertAppointment(appointment: Appointment): Promise<void> {
  await setEntity('appointments', normalizeAppointment(appointment));
}

export async function updateAppointment(id: string, patch: Partial<Appointment>): Promise<void> {
  await updateEntity('appointments', id, patch);
}

export async function deleteAppointment(id: string): Promise<void> {
  await deleteDoc(documentRef('appointments', id));
}

export async function getAllBudgets(): Promise<Budget[]> {
  return sortByCreatedAtDesc((await getAll<Budget>('budgets')).map(normalizeBudget));
}

export async function insertBudget(budget: Budget): Promise<void> {
  await setEntity('budgets', normalizeBudget(budget));
}

export async function updateBudgetStatus(id: string, status: Budget['status']): Promise<void> {
  await updateEntity('budgets', id, { status });
}

export async function updateBudget(id: string, patch: Partial<Budget>): Promise<void> {
  await updateEntity('budgets', id, patch);
}

export async function deleteBudget(id: string): Promise<void> {
  await deleteDoc(documentRef('budgets', id));
}

export async function getAllEmployees(): Promise<Employee[]> {
  return sortByCreatedAtDesc(await getAll<Employee>('employees'));
}

export async function insertEmployee(employee: Employee): Promise<void> {
  await setEntity('employees', employee);
}

export async function updateEmployee(id: string, patch: Partial<Employee>): Promise<void> {
  await updateEntity('employees', id, patch);
}

export async function deleteEmployee(id: string): Promise<void> {
  await deleteDoc(documentRef('employees', id));
}

// ----- Notification reads (single global doc keyed 'global') -----

export async function getNotificationReads(): Promise<NotificationReads | null> {
  const snapshot = await getDoc(documentRef('notification_reads', 'global'));
  if (!snapshot.exists()) return null;
  const data = snapshot.data() as Partial<NotificationReads>;
  return {
    id: 'global',
    readIds: data.readIds ?? [],
    dismissedIds: data.dismissedIds ?? [],
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  };
}

export async function setNotificationReads(payload: {
  readIds: string[];
  dismissedIds: string[];
}): Promise<void> {
  await setDoc(documentRef('notification_reads', 'global'), stripUndefined({
    id: 'global',
    readIds: payload.readIds,
    dismissedIds: payload.dismissedIds,
    updatedAt: new Date().toISOString(),
  }));
}

export async function insertOrderWithRelations(payload: {
  customer?: Customer;
  vehicle?: Vehicle;
  order: Order;
}): Promise<void> {
  const batch = writeBatch(getFirebaseDb());
  if (payload.customer) batch.set(documentRef('customers', payload.customer.id), stripUndefined(payload.customer));
  if (payload.vehicle) batch.set(documentRef('vehicles', payload.vehicle.id), stripUndefined(payload.vehicle));
  batch.set(documentRef('orders', payload.order.id), stripUndefined(payload.order));
  await batch.commit();
}

export async function insertBudgetWithRelations(payload: {
  customer?: Customer;
  vehicle?: Vehicle;
  budget: Budget;
}): Promise<void> {
  const batch = writeBatch(getFirebaseDb());
  if (payload.customer) batch.set(documentRef('customers', payload.customer.id), stripUndefined(payload.customer));
  if (payload.vehicle) batch.set(documentRef('vehicles', payload.vehicle.id), stripUndefined(payload.vehicle));
  batch.set(documentRef('budgets', payload.budget.id), stripUndefined(normalizeBudget(payload.budget)));
  await batch.commit();
}
