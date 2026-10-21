import React, { type ReactNode, type CSSProperties } from 'react';

export type BadgeVariant = 'neutral' | 'primary' | 'success' | 'warning' | 'info';

export interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  icon,
  className = '',
  style,
}) => {
  return (
    <span className={`ui-badge ui-badge-${variant} ${className}`} style={style}>
      {icon && <span className="badge-icon">{icon}</span>}
      {children}
    </span>
  );
};
