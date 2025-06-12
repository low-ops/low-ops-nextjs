'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TBoard } from '@/lib/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { EllipsisVertical, Trash2 } from 'lucide-react';
import { FC, MouseEvent, useState } from 'react';

type TProps = {
  board: TBoard;
};

export const BoardActionMenu: FC<TProps> = (props) => {
  const { board } = props;

  // Api
  const queryClient = useQueryClient();
  const { mutateAsync: deleteBoard } = useMutation({
    mutationKey: ['boards'],
    mutationFn: async (id: string) => {
      await fetch(`/api/boards/${id}`, { method: 'DELETE' });
    },
  });

  // States
  const [open, setOpen] = useState(false);

  // Handlers
  const handleDeleteBoard = async (event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    setOpen(false);
    try {
      await deleteBoard(board.id);
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    } catch (err) {
      console.error(err);
    }
  };

  // Renders
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="-mr-2">
          <EllipsisVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-auto">
        <DropdownMenuItem onClick={handleDeleteBoard} className="flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-red-500 group-hover:text-red-500" />
          <span className="text-red-500 group-hover:text-red-500">Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default BoardActionMenu;
