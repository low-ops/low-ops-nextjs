'use client';

import { Status, TTask } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useDroppable } from '@dnd-kit/core';
import AddTask from '../tasks/AddTask';
import TaskList from '../tasks/TaskList';
import { Card } from '../ui/card';

type TProps = {
  title: string;
  status: Status;
  isTodo?: boolean;
  tasks: TTask[];
};

const BoardColumn = (props: TProps) => {
  const { title, isTodo = false, tasks, status } = props;

  // Hooks
  const { setNodeRef, isOver } = useDroppable({ id: status });

  // Renders
  return (
    <Card ref={setNodeRef} className="p-0 flex flex-col gap-0 justify-between">
      <h2 className="text-sm font-bold p-4">{title}</h2>
      <div
        className={cn('bg-gray-100 flex-1 p-4 transition-colors', !isTodo && 'rounded-b-md', isOver && 'bg-gray-200')}
      >
        <TaskList tasks={tasks} />
      </div>
      {isTodo && <AddTask />}
    </Card>
  );
};

export default BoardColumn;
