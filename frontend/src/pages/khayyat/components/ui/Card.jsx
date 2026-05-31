import React from 'react';

export const Card = ({ children, className = '', hover = false, ...props }) => {
  return (
    <div
      {...props}
      className={`
      bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-soft
      ${hover ? 'card-hover cursor-pointer' : ''}
      ${className}
    `}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => {
  return (
    <div className={`px-6 py-4 border-b border-gray-100 dark:border-slate-800 ${className}`}>
      {children}
    </div>
  );
};

export const CardBody = ({ children, className = '' }) => {
  return (
    <div className={`px-6 py-4 ${className}`}>
      {children}
    </div>
  );
};

export const CardFooter = ({ children, className = '' }) => {
  return (
    <div className={`px-6 py-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 rounded-b-xl ${className}`}>
      {children}
    </div>
  );
};

export const StatCard = ({ icon: Icon, label, value, trend, color = 'primary' }) => {
  const colors = {
    primary: 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-200',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-200',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-200',
    rose: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-200',
    violet: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-200'
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-slate-100">{value}</p>
          {trend && (
            <p className={`mt-1 text-sm ${trend > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {trend > 0 ? '+' : ''}{trend}%
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg ${colors[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </Card>
  );
};

export default Card;
