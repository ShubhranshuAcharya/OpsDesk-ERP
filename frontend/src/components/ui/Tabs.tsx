import type { ReactNode } from 'react';

export interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="border-b border-ops-border-default flex gap-6 px-6 bg-ops-bg-surface pt-2">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              flex items-center gap-2 pb-3 px-1 border-b-2 text-ops-sm font-medium transition-colors
              ${isActive 
                ? 'border-ops-primary text-ops-primary' 
                : 'border-transparent text-ops-text-secondary hover:text-ops-text-primary hover:border-ops-border-strong'
              }
            `}
          >
            {tab.icon && (
              <span className={isActive ? 'text-ops-primary' : 'text-ops-text-muted'}>
                {tab.icon}
              </span>
            )}
            {tab.label}
            {tab.count !== undefined && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                isActive ? 'bg-ops-primary/10 text-ops-primary' : 'bg-ops-bg-base text-ops-text-muted'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
