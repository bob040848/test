import Task from '../../../mongoose/models/task';
import User from '../../../mongoose/models/user';

const getFinishedTasksLists = async (_: any, { userId }: { userId: string }) => {
  // Check if user exists
  const user = await User.findOne({ userId });
  if (!user) {
    throw new Error('User not found');
  }

  // Find all deleted tasks for the user
  const deletedTasks = await Task.find({ userId, isDeleted: true });
  return deletedTasks;
};

export default getFinishedTasksLists;   