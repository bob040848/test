export type AddTaskInput ={
    taskName: string;
    description: string;
    isDone?: boolean;
    priority: number;
    tags?: string[];
    userId: string;
    isDeleted?: boolean;
  }