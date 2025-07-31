export type UpdateTaskInput = {
  taskId: string;
  taskName?: string;
  description?: string;
  isDone?: boolean;
  priority?: number;
  tags?: string[];
  userId: string;
};