'use client';

import type { Dispatch, SetStateAction, SyntheticEvent } from 'react';
import { readJsonResponse } from '@/components/admin/api';
import type { SettingsFormState } from '@/components/admin/types';

type UseSettingsActionsParams = {
  refetch: () => Promise<unknown>;
  setActionMessage: Dispatch<SetStateAction<string>>;
  settingsForm: SettingsFormState;
};

type SettingsMutationResponse = {
  message?: string;
  success: boolean;
};

export function useSettingsActions({
  refetch,
  setActionMessage,
  settingsForm,
}: UseSettingsActionsParams) {
  async function submitSettings(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setActionMessage('');

    const formData = new FormData();
    formData.set('activeDrawId', settingsForm.activeDrawId);
    formData.set('paymentInstructions', settingsForm.paymentInstructions);
    formData.set('qrCodeUrl', settingsForm.qrCodeUrl);
    formData.set('qrCodeBase64', settingsForm.qrCodeBase64);
    if (settingsForm.qrCodeFile) {
      formData.set('qrCodeFile', settingsForm.qrCodeFile);
    }

    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      credentials: 'include',
      body: formData,
    });
    const json = await readJsonResponse<SettingsMutationResponse>(res, 'Could not save payment settings.');

    setActionMessage(json.message || 'Payment settings updated.');
    await refetch();
  }

  return {
    submitSettings,
  };
}
