import Task from "../../../mongoose/models/task";
import User from "../../../mongoose/models/user";
import { UpdateTaskInput } from "../../types/UpdateTaskInput";

export const updateTask = async (_: unknown, { input }: { input: UpdateTaskInput }) => {
  try {
    const { taskId, userId, taskName, description, isDone, priority, tags } = input;

    const user = await User.findOne({ userId });
    if (!user) throw new Error("User not found");

    const task = await Task.findById(taskId);
    if (!task) throw new Error("Task not found");
    if (task.userId !== userId) throw new Error("Unauthorized: You can only update your own tasks");
    if (task.isDeleted) throw new Error("Cannot update deleted task");

    if (priority !== undefined && (priority < 1 || priority > 5)) throw new Error("Priority must be between 1 and 5");
    if (description !== undefined && description.length < 10) throw new Error("Description must be at least 10 characters long");
    const newTaskName = taskName !== undefined ? taskName : task.taskName;
    const newDescription = description !== undefined ? description : task.description;
    if (newDescription === newTaskName) throw new Error("Description cannot be the same as task name");
    if (tags !== undefined && tags.length > 5) throw new Error("Tags array cannot have more than 5 items");

    if (taskName !== undefined && taskName !== task.taskName) {
      const existingTask = await Task.findOne({
        taskName,
        userId,
        isDeleted: false,
        _id: { $ne: taskId },
      });
      if (existingTask) throw new Error("Task name must be unique for this user");
    }

    const updateFields: UpdateTaskInput = {
      taskId,
      userId,
    };
    if (taskName !== undefined) updateFields.taskName = taskName;
    if (description !== undefined) updateFields.description = description;
    if (isDone !== undefined) updateFields.isDone = isDone;
    if (priority !== undefined) updateFields.priority = priority;
    if (tags !== undefined) updateFields.tags = tags;

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      updateFields,
      { new: true, runValidators: true }
    );

    return updatedTask;
  } catch (error) {  
    if (error instanceof Error && error.message.includes("E11000")) {
      throw new Error("Task name must be unique for this user");
    }
    throw new Error(`Failed to update task: ${error instanceof Error ? error.message : String(error)}`);
  }
};