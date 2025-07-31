import Task from "../../../mongoose/models/task";
import User from "../../../mongoose/models/user";
import { AddTaskInput } from "../../types/AddTaskInput";

export const addTask = async (_: unknown, { input }: { input: AddTaskInput }) => {
  try {
    const { taskName, description, isDone = false, priority, tags = [], userId } = input;

    if (priority < 1 || priority > 5) throw new Error("Priority must be between 1 and 5");
    if (description.length < 10) throw new Error("Description must be at least 10 characters long");
    if (description === taskName) throw new Error("Description cannot be the same as task name");
    if (tags.length > 5) throw new Error("Tags array cannot have more than 5 items");

    let user = await User.findOne({ userId });
    if (!user) {
      user = new User({ userId });
      await user.save();
    }

    const existingTask = await Task.findOne({ taskName, userId, isDeleted: false });
    if (existingTask) throw new Error("Task name must be unique for this user");

    const newTask = new Task({
      taskName,
      description,
      isDone,
      priority,
      tags,
      userId,
    });

    const savedTask = await newTask.save();
    return savedTask;
  } catch (error) {
    if (error instanceof Error && error.message.includes("E11000")) {
      throw new Error("Task name must be unique for this user");
    }
    throw new Error(`Failed to create task: ${error instanceof Error ? error.message : String(error)}`);
  }
};