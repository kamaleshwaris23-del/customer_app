import React, { type ReactNode, type CSSProperties } from 'react';

export interface CardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', style, onClick }) => {
  return (
    <div className={`ui-card ${className}`} style={style} onClick={onClick}>
      {children}
    </div>
  );
};

export interface CardHeaderProps {
  children?: ReactNode;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  title,
  subtitle,
  action,
  className = '',
  style,
}) => {
  return (
    <div className={`ui-card-header ${className}`} style={style}>
      {children ? (
        children
      ) : (
        <>
          <div>
            {title && <h3 className="ui-card-title">{title}</h3>}
            {subtitle && <p className="ui-card-subtitle">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </>
      )}
    </div>
  );
};

export interface CardContentProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className = '', style }) => {
  return (
    <div className={`ui-card-content ${className}`} style={style}>
      {children}
    </div>
  );
};

export interface CardFooterProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '', style }) => {
  return (
    <div className={`ui-card-footer ${className}`} style={style}>
      {children}
    </div>
  );
};
