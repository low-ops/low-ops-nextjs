'use client';

import { TCreateBoardData } from '@/lib/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader } from 'lucide-react';
import { FC, useState } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

type TProps = {
  open: boolean;
  onClose: () => void;
};

const CreateBoardDialog: FC<TProps> = (props) => {
  const { open, onClose } = props;

  // Api
  const queryClient = useQueryClient();
  const { mutateAsync: createBoard, isPending: isCreating } = useMutation({
    mutationKey: ['boards'],
    mutationFn: async (formData: FormData) => {
      await fetch('/api/boards', { method: 'POST', body: formData });
    },
  });

  // States
  const [data, setData] = useState<TCreateBoardData>({ name: '', image: null });

  // Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name;
    const value = name === 'image' ? e.target.files?.[0] : e.target.value.replace(/\s+/g, '');
    setData({ ...data, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('image', data.image as File);

    try {
      await createBoard(formData);
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    } catch (error) {
      console.error(error);
    } finally {
      setData({ name: '', image: null });
      onClose();
    }
  };

  // Renders
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader className="mb-5">
          <DialogTitle>Create new board</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 mb-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="name">Board name</Label>
            <Input
              required
              type="text"
              id="name"
              placeholder="Board name"
              name="name"
              value={data.name}
              onChange={handleChange}
            />
          </div>

          <div className="grid w-full items-center gap-1.5 mb-2">
            <Label htmlFor="image">Image</Label>
            <Input required={false} id="image" type="file" accept="image/*" name="image" onChange={handleChange} />
          </div>

          <Button size="lg" type="submit" disabled={isCreating} className="flex flex-row relative">
            {isCreating ? 'Creating...' : 'Create'}
            {isCreating && <Loader className="animate-spin h-4 w-4 absolute right-4" />}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateBoardDialog;
