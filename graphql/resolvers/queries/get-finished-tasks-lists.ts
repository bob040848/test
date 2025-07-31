import Task from "../../../mongoose/models/task";
import User from "../../../mongoose/models/user";

export const getFinishedTasksLists = async (_: unknown, { userId }: { userId: string }) => {
  try {
    const user = await User.findOne({ userId });
    if (!user) throw new Error("User not found");

    const deletedTasks = await Task.find({
      userId,
      isDeleted: true,
    }).sort({ updatedAt: -1 });

    return deletedTasks;
  } catch (error) {
    throw new Error(`Failed to fetch deleted tasks: ${error instanceof Error ? error.message : String(error)}`);
  }
};   