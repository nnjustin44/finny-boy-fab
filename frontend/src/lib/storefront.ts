import { useEffect, useState } from 'react';

export type StorefrontConfig = { supportEmail: string; checkoutEnabled: boolean; madeToOrder: boolean };
const safeDefaults: StorefrontConfig = { supportEmail: 'finnyboyfab@gmail.com', checkoutEnabled: false, madeToOrder: false };
let pending: Promise<StorefrontConfig> | undefined;

function loadConfig() {
  if (!pending) {
    pending = fetch('/api/storefront', { cache: 'no-store' }).then(async response => {
      if (!response.ok) throw new Error('Store information is temporarily unavailable. Please refresh to try again.');
      const value = await response.json() as StorefrontConfig;
      if (typeof value.supportEmail !== 'string' || typeof value.checkoutEnabled !== 'boolean' || typeof value.madeToOrder !== 'boolean') {
        throw new Error('Store information is temporarily unavailable. Please refresh to try again.');
      }
      return value;
    }).catch(error => { pending = undefined; throw error; });
  }
  return pending;
}

export function useStorefrontConfig() {
  const [config, setConfig] = useState<StorefrontConfig>(safeDefaults);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void loadConfig().then(value => { if (active) setConfig(value); })
      .catch((failure: unknown) => { if (active) setError(failure instanceof Error ? failure.message : 'Unable to load store information.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  return { config, loading, error };
}
