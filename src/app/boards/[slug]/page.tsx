'use client';

import BoardHeader from '@/components/boards/BoardHeader';
import ColumnsContainer from '@/components/tasks/ColumnsContainer';
import { Status } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';
import { Loader } from 'lucide-react';
import { useParams } from 'next/navigation';

const BoardPage = () => {
  const { slug } = useParams();

  // Api
  const { data: todoTasks, isPending: isPendingTodo } = useQuery({
    queryKey: ['tasks', Status.TODO],
    queryFn: async () => {
      const res = await fetch(`/api/boards/${slug}/tasks/${Status.TODO}`);
      const data = await res.json();
      return data;
    },
  });

  const { data: inProgressTasks, isPending: isPendingProgress } = useQuery({
    queryKey: ['tasks', Status.IN_PROGRESS],
    queryFn: async () => {
      const res = await fetch(`/api/boards/${slug}/tasks/${Status.IN_PROGRESS}`);
      const data = await res.json();
      return data;
    },
  });

  const { data: doneTasks, isPending: isPendingDone } = useQuery({
    queryKey: ['tasks', Status.DONE],
    queryFn: async () => {
      const res = await fetch(`/api/boards/${slug}/tasks/${Status.DONE}`);
      const data = await res.json();
      return data;
    },
  });

  // Renders
  if (isPendingTodo || isPendingProgress || isPendingDone) {
    return (
      <div className="flex justify-center items-center h-full py-10">
        <Loader className="animate-spin h-8 w-8" />
      </div>
    );
  }

  return (
    <>
      <BoardHeader />
      <main className="bg-gray-100 h-full min-h-[calc(100vh-70px)]">
        <div className="container mx-auto py-8 px-4 w-full">
          <ColumnsContainer todoTasks={todoTasks} inProgressTasks={inProgressTasks} doneTasks={doneTasks} />
        </div>
      </main>
    </>
  );
};

export default BoardPage;
