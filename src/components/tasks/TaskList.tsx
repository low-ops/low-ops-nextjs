'use client';

import { TTask } from '@/lib/types';
import Image from 'next/image';
import TaskCard from './TaskCard';

type TProps = {
  tasks: TTask[];
};

const TaskList = (props: TProps) => {
  const { tasks } = props;

  // Renders
  if (tasks?.length === 0) {
    return (
      <span className="text-sm text-gray-400 py-2 flex flex-col items-center justify-center gap-1">
        <Image src="/no-data.svg" alt="No tasks" width={100} height={100} />
        No tasks yet
      </span>
    );
  }

  const renderTasks = () => {
    return tasks?.map((task) => <TaskCard key={task.id} task={task} />);
  };

  return <div className="flex flex-col gap-2">{renderTasks()}</div>;
};

export default TaskList;
