export enum Status {
  DONE = 'DONE',
  IN_PROGRESS = 'IN_PROGRESS',
  TODO = 'TODO',
}

export type TTask = {
  id: string;
  title: string;
  description: string;
  status: Status;
  createdAt: string;
  updatedAt: string;
};

export type TColumn = {
  id: string;
  name: string;
  cards: TTask[];
};

export type TBoard = {
  id: string;
  name: string;
  image: string;
  createdAt: string;
  updatedAt: string;
};

export type TCreateBoardData = {
  name: string;
  image: File | null;
};
