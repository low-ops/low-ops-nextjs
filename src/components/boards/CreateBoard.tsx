'use client';

import { Plus } from 'lucide-react';
import { FC, useState } from 'react';
import { Button } from '../ui/button';
import CreateBoardDialog from './CreateBoardDialog';

const CreateBoard: FC = () => {
  // States
  const [open, setOpen] = useState(false);

  // Handlers
  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  // Renders
  return (
    <>
      <Button onClick={handleOpen}>
        <Plus className="h-4 w-4" />
        Create Board
      </Button>
      <CreateBoardDialog open={open} onClose={handleClose} />
    </>
  );
};

export default CreateBoard;
