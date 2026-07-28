export type TabName = 'dashboard' | 'orders' | 'inventory' | 'schedule' | 'profile';

export interface TabConfig {
  key: TabName;
  icon: string;
  label: string;
  route: `/(tabs)/${TabName}`;
}

export type OrderRouteParams = { id: string };
export type CustomerRouteParams = { id?: string };
export type VehicleRouteParams = { id?: string };
export type PartRouteParams = { id?: string };
export type TicketRouteParams = { id: string };
