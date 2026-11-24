import React, { useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';

interface ExportCodeViewProps {
  filename: string;
  title: string;
  description: string;
  code: string;
  mimeType: string;
}

export const ExportCodeView: React.FC<ExportCodeViewProps> = ({
  filename,
  title,
  description,
  code,
  mimeType,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const lines = code.split('\n');

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-ui-display text-lg font-bold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500">
            {description} · <span className="font-ui-mono">{lines.length} líneas</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 transition-colors hover:bg-slate-50 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copiar {filename}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            Descargar
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-[#0F172A] text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5 text-xs text-slate-400">
          <span className="font-ui-mono font-medium text-slate-200">{filename}</span>
          <span className="font-ui-mono text-[11px]">{mimeType}</span>
        </div>
        <div className="max-h-[68vh] overflow-auto p-4">
          <pre className="font-ui-mono text-xs leading-relaxed text-slate-200">
            <code>{code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
