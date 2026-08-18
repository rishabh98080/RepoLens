"use client";

interface ScanFormProps {
  url: string;
  setUrl: (url: string) => void;
  isScanning: boolean;
  handleScan: (e?: any) => void;
}

export default function ScanForm({ url, setUrl, isScanning, handleScan }: ScanFormProps) {
  return (
    <div className="search-bar">
      <div className="input-wrap">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2">
          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
        </svg>
        <input 
          type="url" 
          placeholder="https://github.com/owner/repository" 
          value={url} 
          onChange={e => setUrl(e.target.value)}
          disabled={isScanning}
        />
      </div>
      <button 
        className="btn" 
        onClick={handleScan} 
        disabled={isScanning || !url}
      >
        {isScanning ? 'Analyzing...' : 'Analyze repository'}
        {!isScanning && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>}
      </button>
    </div>
  );
}
