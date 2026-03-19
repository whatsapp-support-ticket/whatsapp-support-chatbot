export interface Draw {
  _id: string;
  drawName: string;
  drawDate?: string;
  ticketPrice: number;
}

export interface Ticket {
  _id: string;
  ticketNumber: string;
  status: 'available' | 'reserved' | 'sold';
  reservedBy?: string;
  soldTo?: string;
}

export interface Payment {
  _id: string;
  phoneNumber: string;
  ticketNumber: string;
  screenshotUrl?: string;
  utrNumber?: string;
  status: string;
  createdAt?: string;
}

export interface Settings {
  qrCodeUrl?: string;
  paymentInstructions?: string;
  activeDrawId?: string;
}

export interface DashboardResponse {
  stats: {
    availableTickets: number;
    reservedTickets: number;
    soldTickets: number;
    pendingPayments: number;
  };
  draws: Draw[];
  tickets: Ticket[];
  payments: Payment[];
  settings: Settings | null;
}

export interface DrawFormState {
  drawName: string;
  ticketPrice: string;
}

export interface TicketFormState {
  drawId: string;
  prefix: string;
  count: string;
  ticketNumber: string;
}

export interface SettingsFormState {
  activeDrawId: string;
  paymentInstructions: string;
  qrCodeUrl: string;
  qrCodeBase64: string;
  qrCodeFile: File | null;
}

export interface PaymentFormState {
  phoneNumber: string;
  utrNumber: string;
  screenshotUrl: string;
}

export type TicketMode = 'bulk' | 'single' | 'edit';

export type PaymentFilter = 'all' | 'pending' | 'approved' | 'rejected';
