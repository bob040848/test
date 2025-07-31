import Task from "../../../mongoose/models/task";

export const getAllTasks = async () => {
  try {
    const tasks = await Task.find({ isDeleted: false }).sort({ createdAt: -1 });
    return tasks;
  } catch (error) {
    throw new Error(`Failed to fetch tasks: ${error instanceof Error ? error.message : String(error)}`);
  }
};