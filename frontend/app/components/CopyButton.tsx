"use client";

import { useState } from 'react';

export default function CopyButton({ textToCopy, className = "" }: { textToCopy: string, className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <button 
      onClick={handleCopy} 
      className={`copy-btn ${className}`}
      title="Copy to clipboard"
      style={{
        background: 'transparent',
        border: 'none',
        color: copied ? 'var(--green)' : 'var(--muted)',
        cursor: 'pointer',
        padding: '4px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '4px',
        transition: '0.2s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = copied ? 'var(--green)' : '#fff')}
      onMouseLeave={(e) => (e.currentTarget.style.color = copied ? 'var(--green)' : 'var(--muted)')}
    >
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"></path></svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
      )}
    </button>
  );
}
