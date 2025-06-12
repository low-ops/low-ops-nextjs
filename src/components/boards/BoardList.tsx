'use client';

import { Card } from '@/components/ui/card';
import { TBoard } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';
import { Loader } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import BoardActionMenu from './BoardActionMenu';

const BoardList = () => {
  // Api
  const { data: boards, isPending: isLoadingBoards } = useQuery({
    queryKey: ['boards'],
    queryFn: async (): Promise<TBoard[]> => {
      const res = await fetch('/api/boards');
      const data = await res.json();
      return data.boards;
    },
  });

  // Renders
  if (isLoadingBoards) {
    return (
      <div className="text-center py-12 flex flex-col items-center gap-2 relative">
        <Loader className="animate-spin h-8 w-8" />
      </div>
    );
  }

  if (boards?.length === 0) {
    return (
      <div className="text-center py-12 flex flex-col items-center gap-2 relative">
        <Image src="/no-data.svg" alt="No boards" width={130} height={130} />
        <h2 className="text-xl font-medium text-gray-600">No boards yet</h2>
        <p className="text-gray-400">Create your first board to get started</p>
      </div>
    );
  }

  const renderBoards = () => {
    return boards?.map((board) => (
      <Link key={board.id} href={`/boards/${board.name}`}>
        <Card className="overflow-hidden hover:border-gray-300 transition-border cursor-pointer h-60 relative p-0 gap-0">
          <div className="relative h-52 w-full border-b border-gray-200">
            <Image src={board.image || '/placeholder.svg'} alt={board.name} fill className="object-cover" />
          </div>
          <div className="flex justify-between items-center px-4 py-2">
            <h2 className="text-md font-medium">{board?.name}</h2>
            <BoardActionMenu board={board} />
          </div>
        </Card>
      </Link>
    ));
  };

  return <div className="grid xs:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{renderBoards()}</div>;
};

export default BoardList;
