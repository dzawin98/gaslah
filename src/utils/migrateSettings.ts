import { api } from '@/utils/api';

const FLAG_KEY = 'settings-migrated-v1';

function safeParse<T = any>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    // Not JSON, return as-is
    return raw as unknown as T;
  }
}

export async function migrateLocalSettings(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const already = localStorage.getItem(FLAG_KEY);
    if (already === 'true') return;

    const wahaConfig = safeParse<Record<string, any>>(localStorage.getItem('wahaConfig'));
    const customerWa = safeParse<any>(localStorage.getItem('customer-whatsapp-settings'));
    const txnWa = safeParse<any>(localStorage.getItem('whatsapp-settings'));
    const msgHistory = safeParse<any>(localStorage.getItem('messageHistory'));

    const tasks: Promise<any>[] = [];

    if (wahaConfig && typeof wahaConfig === 'object') {
      // Server expects raw config object for WAHA
      tasks.push(api.put('/settings/waha', wahaConfig));
    }

    if (customerWa !== null && customerWa !== undefined) {
      tasks.push(api.put('/settings/customer-whatsapp-settings', { value: customerWa }));
    }

    if (txnWa !== null && txnWa !== undefined) {
      tasks.push(api.put('/settings/whatsapp-settings', { value: txnWa }));
    }

    // Migrate message history as-is; stored array of objects with sentAt ISO strings
    if (msgHistory !== null && msgHistory !== undefined) {
      tasks.push(api.put('/settings/messageHistory', { value: msgHistory }));
    }

    if (tasks.length > 0) {
      await Promise.allSettled(tasks);
    }

    // Mark as migrated regardless of individual failures to avoid repeat attempts
    localStorage.setItem(FLAG_KEY, 'true');
  } catch (err) {
    console.error('Migration error:', err);
    // Do not set flag on unexpected crash to allow retry next load
  }
}

export default migrateLocalSettings;
