'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

const BoardHeader = () => {
  // Hooks
  const { slug } = useParams();
  const router = useRouter();

  // Handlers
  const handleGoBack = () => {
    router.back();
  };

  return (
    <header className="bg-background border-b">
      <div className="container mx-auto py-4 px-4 h-full w-full flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={handleGoBack}>
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-bold">{slug}</h1>
      </div>
    </header>
  );
};

export default BoardHeader;
