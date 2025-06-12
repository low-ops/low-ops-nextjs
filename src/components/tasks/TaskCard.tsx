'use client';

import { TTask } from '@/lib/types';
import { useDraggable } from '@dnd-kit/core';
import { GripVertical } from 'lucide-react';
import { FC } from 'react';
import { Card } from '../ui/card';

type TProps = {
  task: TTask;
};

const TaskCard: FC<TProps> = (props) => {
  const { task } = props;

  // Hooks
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: task.id });

  // Styles
  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined;

  // Renders
  return (
    <Card
      key={task.id}
      {...attributes}
      {...listeners}
      ref={setNodeRef}
      style={style}
      className="p-3 text-sm flex flex-row items-center justify-start gap-2 text-left cursor-pointer hover:border-gray-300"
    >
      <GripVertical className="w-4 h-4 text-gray-400" />
      <p className="flex-1">{task.title}</p>
    </Card>
  );
};

export default TaskCard;
