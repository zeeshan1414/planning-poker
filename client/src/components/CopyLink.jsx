import { useState } from 'react';
import { useI18n } from '../lib/i18n.jsx';

export default function CopyLink() {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt(t('copy.prompt'), window.location.href);
    }
  };

  return <button onClick={copy}>{copied ? t('copy.done') : t('copy.button')}</button>;
}
