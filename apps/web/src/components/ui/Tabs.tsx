import React, { ReactNode, useState } from 'react';

interface TabsProps {
  defaultValue?: string;
  children: ReactNode;
  className?: string;
}

interface TabsListProps {
  children: ReactNode;
  className?: string;
}

interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  activeTab?: string;
  setActiveTab?: (v: string) => void;
}

interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
  activeTab?: string;
}

export const Tabs = ({ defaultValue = '', children, className = '' }: TabsProps) => {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <div className={className} data-active-tab={activeTab}>
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<any>, { activeTab, setActiveTab })
          : child
      )}
    </div>
  );
};

export const TabsList = ({ children, className = '' }: TabsListProps) => {
  return (
    <div className={`flex border-b border-gray-200 gap-2 ${className}`}>
      {children}
    </div>
  );
};

export const TabsTrigger = ({ value, children, activeTab = '', setActiveTab = () => {} }: TabsTriggerProps) => {
  return (
    <button
      onClick={() => setActiveTab(value)}
      className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
        activeTab === value
          ? 'border-primary-600 text-primary-600'
          : 'border-transparent text-gray-600 hover:text-gray-900'
      }`}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({ value, children, className = '', activeTab = '' }: TabsContentProps) => {
  if (activeTab !== value) return null;

  return <div className={className}>{children}</div>;
};
