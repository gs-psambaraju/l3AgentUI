import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = `
    inline-flex items-center justify-center font-medium rounded-lg
    transition-all duration-200 ease-out
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
    disabled:opacity-50 disabled:cursor-not-allowed
    relative overflow-hidden
  `.replace(/\s+/g, ' ').trim();
  
  const variantClasses = {
    primary: `
      bg-blue-600 text-white
      hover:bg-blue-700
      focus:ring-blue-500
    `.replace(/\s+/g, ' ').trim(),
    
    secondary: `
      bg-gray-600 text-white
      hover:bg-gray-700
      focus:ring-gray-500
    `.replace(/\s+/g, ' ').trim(),
    
    success: `
      bg-green-600 text-white
      hover:bg-green-700
      focus:ring-green-500
    `.replace(/\s+/g, ' ').trim(),
    
    danger: `
      bg-red-600 text-white
      hover:bg-red-700
      focus:ring-red-500
    `.replace(/\s+/g, ' ').trim(),
    
    ghost: `
      bg-transparent text-gray-300 border border-gray-600
      hover:bg-gray-800 hover:border-gray-500
      focus:ring-gray-500
    `.replace(/\s+/g, ' ').trim(),
    
    outline: `
      bg-transparent border border-blue-600 text-blue-400
      hover:bg-blue-600 hover:text-white
      focus:ring-blue-500
    `.replace(/\s+/g, ' ').trim(),
  };
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <button
      className={combinedClasses}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* Loading spinner */}
      {isLoading && (
        <div className="mr-2">
          <div className="spinner-modern"></div>
        </div>
      )}
      
      {/* Button content */}
      <span>{children}</span>
    </button>
  );
}

export default Button; 