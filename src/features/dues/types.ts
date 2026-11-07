import type { Database } from '@/lib/database.types';

export type Due = Database['public']['Tables']['dues']['Row'];
export type Payment = Database['public']['Tables']['payments']['Row'];
export type DueStatus = Database['public']['Enums']['due_status'];
export type PaymentMethod = 'cash' | 'bank_transfer' | 'card' | 'other';

export const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'bank_transfer', 'card', 'other'];

export type DueWithPayments = Due & { payments: Payment[] };

export type ManagerDue = DueWithPayments & {
  unitLabel: string;
  residentNames: string[];
};

export type ResidentSummary = {
  outstanding: number;
  overdueCount: number;
  nextDueDate: string | null;
};
