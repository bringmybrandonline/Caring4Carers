"use client";

export default function CopyButton({ code }: { code: string }) {
  return (
    <button
      onClick={() => navigator.clipboard.writeText(code)}
      className="text-gray-400 hover:text-indigo-600 transition-colors"
      title="Copy to clipboard"
    >
      <i className="fas fa-copy"></i>
    </button>
  );
}
