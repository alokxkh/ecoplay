import React from 'react';

export const ProjectCardSkeleton = () => {
  return (
    <div className="bg-white/5 backdrop-blur-lg p-4 rounded-xl border border-white/10 animate-pulse flex flex-col items-center justify-center">
      {/* Emoji Space Placeholder */}
      <div className="w-16 h-16 bg-white/10 rounded-full mb-3" />
      
      {/* Label Text Line Placeholder */}
      <div className="h-4 bg-white/10 rounded w-2/3 mb-2" />
      
      {/* Points Label Line Placeholder */}
      <div className="h-3 bg-white/10 rounded w-1/3" />
    </div>
  );
};

export default ProjectCardSkeleton;