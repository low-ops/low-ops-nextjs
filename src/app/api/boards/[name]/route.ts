import { deleteBoard, getBoardByName } from '@/modules/boards.db';
import { NextRequest } from 'next/server';

type TParams = {
  params: Promise<{ name: string }>;
};

export async function GET(_: NextRequest, { params }: TParams) {
  const { name } = await params;
  const board = await getBoardByName(name);
  return Response.json({ board });
}

export async function DELETE(_: NextRequest, { params }: TParams) {
  const { name } = await params;
  const board = await deleteBoard(name);
  return Response.json({ board });
}
