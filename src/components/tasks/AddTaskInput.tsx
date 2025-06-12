'use client';

import { Status } from '@prisma/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

type TProps = {
  onClose: () => void;
};

const AddTaskInput = (props: TProps) => {
  const { onClose } = props;
  const [value, setValue] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  // Api
  const { mutateAsync: createTask, isPending } = useMutation({
    mutationKey: ['tasks'],
    mutationFn: async (data: { title: string; boardName: string }) => {
      await fetch(`/api/boards/${data.boardName}/tasks`, { method: 'POST', body: JSON.stringify(data.title) });
    },
  });

  // Hooks
  const queryClient = useQueryClient();
  const { slug } = useParams();

  // Effects
  useEffect(() => {
    inputRef.current?.focus();
  }, [onClose]);

  // Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!value.trim()) return;

    try {
      await createTask({ title: value, boardName: slug as string });
      await queryClient.invalidateQueries({ queryKey: ['tasks', Status.TODO] });
    } catch (err) {
      console.error(err);
    } finally {
      onClose();
    }
  };

  // Renders
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 py-2">
      <Input
        required
        type="text"
        id="name"
        placeholder="Enter task title"
        name="name"
        value={value}
        onChange={handleChange}
        disabled={isPending}
        ref={inputRef}
      />
      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="secondary" size="icon" className="flex-1" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button size="icon" className="flex-1 relative" type="submit" disabled={isPending}>
          {isPending ? 'Adding...' : 'Add'}
          {isPending && <Loader className="ml-2 h-4 w-4 animate-spin absolute right-4" />}
        </Button>
      </div>
    </form>
  );
};

export default AddTaskInput;
