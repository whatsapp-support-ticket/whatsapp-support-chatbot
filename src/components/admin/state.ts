import type {
  DrawFormState,
  PaymentFormState,
  SettingsFormState,
  TicketFormState,
} from '@/components/admin/types';

export const emptyDrawForm: DrawFormState = {
  drawName: '',
  ticketPrice: '',
};

export const emptyTicketForm: TicketFormState = {
  drawId: '',
  prefix: '',
  count: '',
  ticketNumber: '',
};

export const emptySettingsForm: SettingsFormState = {
  activeDrawId: '',
  paymentInstructions: '',
  qrCodeUrl: '',
  qrCodeBase64: '',
  qrCodeFile: null,
};

export const emptyPaymentForm: PaymentFormState = {
  phoneNumber: '',
  utrNumber: '',
  screenshotUrl: '',
};
