import { X } from "lucide-react";
import type { ReactNode } from "react";

interface BaseModalProps {
  onClose: () => void;
  title: string;
  icon?: ReactNode;
  maxWidth?: string;
  children: ReactNode;
}

export function BaseModal({ onClose, title, icon, maxWidth = "max-w-lg", children }: BaseModalProps) {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80">
      <div className={`bg-gray-900 rounded-lg p-6 ${maxWidth} w-full mx-4 shadow-2xl border border-gray-800 max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            {icon}
            {title}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
