'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';
import AddTaskInput from './AddTaskInput';

const AddTask = () => {
  // States
  const [isAddingTask, setIsAddingTask] = useState(false);

  // Handlers
  const handleAddTask = () => {
    setIsAddingTask(true);
  };

  const handleClose = () => {
    setIsAddingTask(false);
  };

  // Renders
  return (
    <div className="flex flex-col gap-2 w-full p-2">
      {isAddingTask && <AddTaskInput onClose={handleClose} />}
      {!isAddingTask && (
        <Button variant="ghost" className="w-full" onClick={handleAddTask}>
          <Plus /> Add
        </Button>
      )}
    </div>
  );
};

export default AddTask;
