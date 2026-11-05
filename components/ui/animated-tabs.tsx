'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { motionTransitions } from '../../lib/motion-tokens';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  content?: React.ReactNode;
  badge?: string | number;
}

export interface AnimatedTabsProps {
  tabs: TabItem[];
  defaultTab?: string;
  activeTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
  tabsContainerClassName?: string;
  renderContent?: boolean;
  layoutId?: string;
  variant?: 'default' | 'glass' | 'pill';
}

export const AnimatedTabs: React.FC<AnimatedTabsProps> = ({
  tabs,
  defaultTab,
  activeTab: controlledActiveTab,
  onChange,
  className,
  tabsContainerClassName,
  renderContent = true,
  layoutId: customLayoutId,
  variant = 'default',
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState<string>(defaultTab || tabs[0]?.id || '');
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;
  const uniqueId = React.useId();
  const indicatorLayoutId = customLayoutId || `active-tab-indicator-${uniqueId}`;

  const handleTabClick = (tabId: string) => {
    if (controlledActiveTab === undefined) {
      setInternalActiveTab(tabId);
    }
    onChange?.(tabId);
  };

  const currentTabObj = tabs.find((t) => t.id === activeTab);
  const isGlass = variant === 'glass' || variant === 'pill';

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div
        className={cn(
          'flex items-center gap-1 self-start select-none',
          isGlass
            ? 'p-1 rounded-full bg-sand border border-line'
            : 'p-1 rounded-xl bg-sand border border-line',
          tabsContainerClassName
        )}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={cn(
                'relative text-xs sm:text-sm font-medium transition-colors focus-ring select-none flex items-center gap-2 cursor-pointer',
                isGlass
                  ? 'px-4 py-1.5 rounded-full'
                  : 'px-3.5 py-1.5 rounded-lg',
                isActive
                  ? 'text-ink font-medium'
                  : 'text-muted-foreground hover:text-ink'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId={indicatorLayoutId}
                  className={cn(
                    'absolute inset-0 shadow-xs',
                    isGlass
                      ? 'rounded-full bg-card border border-line'
                      : 'rounded-lg bg-card border border-line'
                  )}
                  transition={motionTransitions.springMorph}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                {tab.icon && <span>{tab.icon}</span>}
                {tab.label}
                {tab.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-muted border border-line text-text-secondary dark:bg-[#141414] dark:border-[#1F1F1F] dark:text-[#A1A1A1]">
                    {tab.badge}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {renderContent && (
        <div className="relative min-h-[60px]">
          <AnimatePresence mode="wait">
            {currentTabObj?.content && (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={motionTransitions.springGentle}
                className="text-sm text-body"
              >
                {currentTabObj.content}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
