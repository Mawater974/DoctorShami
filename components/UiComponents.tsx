import React from 'react';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger', size?: 'sm' | 'md' | 'lg' }> = ({ 
  className = '', 
  variant = 'primary', 
  size = 'md',
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const sizeStyles = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2",
      lg: "px-6 py-3 text-lg"
  };

  const variants = {
    primary: "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600",
    outline: "border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 focus:ring-gray-400 bg-transparent",
    ghost: "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 bg-transparent",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
  };

  return (
    <button className={`${baseStyles} ${sizeStyles[size]} ${variants[variant]} ${className}`} {...props} />
  );
};

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={`bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden ${className}`} {...props}>
    {children}
  </div>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, className = '', ...props }) => (
  <div className="space-y-1 w-full">
    {label && <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
    <input 
      className={`w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all dark:text-white ${className}`} 
      {...props} 
    />
  </div>
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string, options: {value: string | number, label: string}[] }> = ({ label, options, className = '', ...props }) => (
  <div className="space-y-1 w-full">
    {label && <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
    <select 
      className={`w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all dark:text-white ${className}`} 
      {...props} 
    >
        {options.map((opt, i) => (
            <option key={i} value={opt.value}>{opt.label}</option>
        ))}
    </select>
  </div>
);

export const Badge: React.FC<{ children: React.ReactNode, variant?: 'success' | 'blue' | 'warning' | 'info' | 'danger' , className?: string}> = ({ children, variant = 'blue', className = '' }) => {
  const colors = {
    success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    warning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    info: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
    danger: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[variant as keyof typeof colors] || colors.blue} ${className}`}>
      {children}
    </span>
  );
};

export const Spinner: React.FC = () => (
    <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
);