import React from 'react';
import { Card } from './card';

interface FormSectionProps {
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

/**
 * 表单分节组件，用于将表单分为多个逻辑部分
 */
const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  className = '',
  children,
  collapsible = false,
  defaultCollapsed = false
}) => {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);

  const toggleCollapse = () => {
    if (collapsible) {
      setCollapsed(!collapsed);
    }
  };

  return (
    <Card className={`overflow-hidden ${className}`}>
      <div
        className={`
          p-5 border-b bg-muted/40 
          ${collapsible ? 'cursor-pointer' : ''}
        `}
        onClick={toggleCollapse}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">{title}</h3>
          {collapsible && (
            <button 
              type="button" 
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
              onClick={toggleCollapse}
            >
              {collapsed ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              )}
            </button>
          )}
        </div>
        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </div>
      <div className={`p-5 ${collapsed ? 'hidden' : 'block'}`}>
        {children}
      </div>
    </Card>
  );
};

export { FormSection };
