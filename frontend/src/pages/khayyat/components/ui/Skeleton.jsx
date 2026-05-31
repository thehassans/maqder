import React from 'react';

export const Skeleton = ({ className = '', variant = 'default' }) => {
  const baseClass = 'animate-pulse bg-gray-200 dark:bg-slate-700 rounded-lg';
  
  return <div className={`${baseClass} ${className}`} />;
};

export const SkeletonText = ({ lines = 3, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {[...Array(lines)].map((_, i) => (
      <Skeleton 
        key={i} 
        className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`} 
      />
    ))}
  </div>
);

export const SkeletonCard = ({ className = '' }) => (
  <div className={`bg-white dark:bg-slate-800 rounded-2xl p-6 ${className}`}>
    <div className="flex items-center gap-4 mb-4">
      <Skeleton className="w-12 h-12 rounded-xl" />
      <div className="flex-1">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-6 w-16" />
      </div>
    </div>
  </div>
);

export const SkeletonTable = ({ rows = 5 }) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700">
      <Skeleton className="h-5 w-32" />
    </div>
    <div className="divide-y divide-gray-100 dark:divide-slate-700">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="px-6 py-4 flex items-center gap-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-4 w-16 ml-auto" />
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonStats = ({ count = 4 }) => (
  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${count} gap-4`}>
    {[...Array(count)].map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export const DashboardSkeleton = () => (
  <div className="space-y-6 animate-fadeIn">
    <div className="flex items-center justify-between">
      <div>
        <Skeleton className="h-8 w-40 mb-2" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
    <SkeletonStats count={4} />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
    <SkeletonTable rows={5} />
  </div>
);

export const PageSkeleton = () => (
  <div className="space-y-6 animate-fadeIn">
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-32 rounded-xl" />
    </div>
    <SkeletonTable rows={8} />
  </div>
);

export const FormSkeleton = () => (
  <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
    <Skeleton className="h-8 w-48 mb-6" />
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 space-y-6">
      {[...Array(4)].map((_, i) => (
        <div key={i}>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      ))}
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  </div>
);

export default Skeleton;
