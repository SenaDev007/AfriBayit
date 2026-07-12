import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, CheckCircle, XCircle } from 'lucide-react';

export function ListingCardSkeleton() {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

export function RoomCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="w-3 h-3 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-14 rounded-xl" />
        <Skeleton className="h-14 rounded-xl" />
      </div>
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-16 rounded-lg" />
        <Skeleton className="h-5 w-16 rounded-lg" />
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  );
}

export function MealCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border text-center space-y-3">
      <Skeleton className="h-10 w-10 mx-auto rounded-lg" />
      <Skeleton className="h-5 w-24 mx-auto" />
      <Skeleton className="h-8 w-20 mx-auto" />
    </div>
  );
}

export function StaffRowSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="h-6 w-20 rounded-lg" />
    </div>
  );
}

export function PricingCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border text-center space-y-2">
      <Skeleton className="h-8 w-8 mx-auto rounded-lg" />
      <Skeleton className="h-5 w-24 mx-auto" />
      <Skeleton className="h-7 w-16 mx-auto" />
      <Skeleton className="h-3 w-20 mx-auto" />
    </div>
  );
}

export function CertificationBadge({ status }: { status: string }) {
  const isCertified = status === 'certified';
  const isInProgress = status === 'pending';

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 text-[10px] font-bold rounded-full text-white ${
      isCertified ? 'bg-[#00A651]' : isInProgress ? 'bg-[#D4AF37]' : 'bg-gray-500'
    }`}>
      {isCertified ? <CheckCircle className="w-3 h-3" /> : isInProgress ? <Calendar className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {isCertified ? 'Certifié' : isInProgress ? 'En cours' : 'Non certifié'}
    </span>
  );
}
