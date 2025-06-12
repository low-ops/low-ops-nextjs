'use client';

import BoardColumn from '@/components/boards/BoardColumn';
import { Status, TTask } from '@/lib/types';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';

type TProps = {
  todoTasks: TTask[];
  inProgressTasks: TTask[];
  doneTasks: TTask[];
};

const ColumnsContainer = (props: TProps) => {
  const { todoTasks, inProgressTasks, doneTasks } = props;

  // Hooks
  const queryClient = useQueryClient();
  const { slug } = useParams();

  // Api
  const { mutateAsync: updateTask } = useMutation({
    mutationKey: ['tasks', slug],
    mutationFn: async (data: { id: string; status: Status }) => {
      await fetch(`/api/boards/${slug}/tasks/${data.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: data.status }),
      });
    },
  });

  // Handlers
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const newStatus = over.id as Status;

    if (activeId === newStatus) return;

    try {
      await updateTask({ id: activeId, status: newStatus });
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch (error) {
      console.error(error);
    }
  };

  // Renders
  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="grid xs:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-content">
        <BoardColumn title="TO DO" isTodo tasks={todoTasks} status={Status.TODO} />
        <BoardColumn title="IN PROGRESS" tasks={inProgressTasks} status={Status.IN_PROGRESS} />
        <BoardColumn title="DONE" tasks={doneTasks} status={Status.DONE} />
      </div>
    </DndContext>
  );
};

export default ColumnsContainer;
