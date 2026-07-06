/* eslint-disable react-refresh/only-export-components */

/**
 * Skeleton loading placeholders for consistent loading UX.
 *
 * Usage:
 *   {loading && <Skeleton.Card />}
 *   {loading && <Skeleton.List count={3} />}
 */

const shimmer = 'animate-pulse bg-gray-200 rounded';

// ---------------------------------------------------------------------------
// Primitive
// ---------------------------------------------------------------------------

function Line({ className = '' }: { className?: string }) {
  return <div className={`${shimmer} h-4 ${className}`} />;
}

function Block({ className = '' }: { className?: string }) {
  return <div className={`${shimmer} ${className}`} />;
}

// ---------------------------------------------------------------------------
// Patterns
// ---------------------------------------------------------------------------

function StatsCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-4">
        <Block className="w-12 h-12 rounded-lg" />
        <div className="space-y-2 flex-1">
          <Line className="w-20" />
          <Line className="w-12 h-6" />
        </div>
      </div>
    </div>
  );
}

function Card() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-4">
        <Block className="w-10 h-10 rounded-lg shrink-0" />
        <div className="space-y-2 flex-1">
          <Line className="w-3/4" />
          <Line className="w-1/2" />
        </div>
        <Block className="w-16 h-6 rounded-full shrink-0" />
      </div>
    </div>
  );
}

function TableRow() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="space-y-3">
        <Line className="w-1/2" />
        <Line className="w-1/3" />
      </div>
    </div>
  );
}

function DetailHeader() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Block className="w-10 h-10 rounded-lg" />
        <div className="space-y-2 flex-1">
          <Line className="w-1/2 h-8" />
          <Line className="w-1/3" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Exported composite
// ---------------------------------------------------------------------------

export const Skeleton = {
  Line,
  Block,
  StatsCard,
  Card,
  TableRow,
  DetailHeader,

  /** 3-column stats grid skeleton */
  StatsGrid() {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatsCard />
        <StatsCard />
        <StatsCard />
      </div>
    );
  },

  /** Stack of card skeletons */
  List({ count = 3 }: { count?: number }) {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i} />
        ))}
      </div>
    );
  },
};
