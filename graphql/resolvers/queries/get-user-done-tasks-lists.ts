import Task from "../../../mongoose/models/task";
import User from "../../../mongoose/models/user";

export const getUserDoneTasksLists = async (_: unknown, { userId }: { userId: string }) => {
  try {
    const user = await User.findOne({ userId });
    if (!user) throw new Error("User not found");

    const completedTasks = await Task.find({
      userId,
      isDone: true,
      isDeleted: false,
    }).sort({ updatedAt: -1 });

    return completedTasks;
  } catch (error) {
    throw new Error(`Failed to fetch completed tasks: ${error instanceof Error ? error.message : String(error)}`);
  }
};