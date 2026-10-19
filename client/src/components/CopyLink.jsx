import { useState } from 'react';

export default function CopyLink() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt('Copy this link:', window.location.href);
    }
  };

  return <button onClick={copy}>{copied ? 'Copied!' : '🔗 Copy invite link'}</button>;
}
