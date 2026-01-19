import { ChevronRight, Home } from 'lucide-react';
import type { BreadcrumbItem } from '../../types';

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
  onNavigate: (folderId: string | null) => void;
}

export function BreadcrumbNav({ items, onNavigate }: BreadcrumbNavProps) {
  return (
    <nav className="flex items-center gap-1 text-sm overflow-x-auto pb-1">
      <button
        onClick={() => onNavigate(null)}
        className="flex items-center gap-1 px-2 py-1 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors shrink-0"
      >
        <Home className="w-4 h-4" />
        <span>My Files</span>
      </button>

      {items.map((item, index) => (
        <div key={item.id ?? 'root'} className="flex items-center shrink-0">
          <ChevronRight className="w-4 h-4 text-gray-400" />
          {index === items.length - 1 ? (
            <span className="px-2 py-1 text-gray-900 font-medium truncate max-w-[200px]">
              {item.name}
            </span>
          ) : (
            <button
              onClick={() => onNavigate(item.id)}
              className="px-2 py-1 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors truncate max-w-[150px]"
            >
              {item.name}
            </button>
          )}
        </div>
      ))}
    </nav>
  );
}
