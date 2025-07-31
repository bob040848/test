// // resolvers/index.js
// const Task = require('../models/Task');
// const User = require('../models/User');
// const { GraphQLScalarType } = require('graphql');
// const { Kind } = require('graphql/language');

// // Custom Date scalar
// const DateType = new GraphQLScalarType({
//   name: 'Date',
//   serialize(value) {
//     return value instanceof Date ? value.toISOString() : null;
//   },
//   parseValue(value) {
//     return new Date(value);
//   },
//   parseLiteral(ast) {
//     if (ast.kind === Kind.STRING) {
//       return new Date(ast.value);
//     }
//     return null;
//   }
// });

// const resolvers = {
//   Date: DateType,

//   Query: {
//     // Get all active (non-deleted) tasks
//     getAllTasks: async () => {
//       try {
//         const tasks = await Task.find({ isDeleted: false }).sort({ createdAt: -1 });
//         return tasks;
//       } catch (error) {
//         throw new Error(`Failed to fetch tasks: ${error.message}`);
//       }
//     },

//     // Get completed tasks for a specific user (GitHub version)
//     getUserDoneTasksLists: async (_, { userId }) => {
//       try {
//         // Check if user exists
//         const user = await User.findOne({ userId });
//         if (!user) {
//           throw new Error('User not found');
//         }

//         const completedTasks = await Task.find({
//           userId,
//           isDone: true,
//           isDeleted: false
//         }).sort({ updatedAt: -1 });

//         return completedTasks;
//       } catch (error) {
//         throw new Error(`Failed to fetch completed tasks: ${error.message}`);
//       }
//     },

//     // Get deleted/finished tasks for a specific user (PDF version)
//     getFinishedTasksLists: async (_, { userId }) => {
//       try {
//         // Check if user exists
//         const user = await User.findOne({ userId });
//         if (!user) {
//           throw new Error('User not found');
//         }

//         const deletedTasks = await Task.find({
//           userId,
//           isDeleted: true
//         }).sort({ updatedAt: -1 });

//         return deletedTasks;
//       } catch (error) {
//         throw new Error(`Failed to fetch deleted tasks: ${error.message}`);
//       }
//     }
//   },

//   Mutation: {
//     // Add a new task
//     addTask: async (_, { input }) => {
//       try {
//         const { taskName, description, isDone = false, priority, tags = [], userId } = input;

//         // Validate priority range
//         if (priority < 1 || priority > 5) {
//           throw new Error('Priority must be between 1 and 5');
//         }

//         // Validate description length
//         if (description.length < 10) {
//           throw new Error('Description must be at least 10 characters long');
//         }

//         // Validate description is not same as taskName
//         if (description === taskName) {
//           throw new Error('Description cannot be the same as task name');
//         }

//         // Validate tags length
//         if (tags.length > 5) {
//           throw new Error('Tags array cannot have more than 5 items');
//         }

//         // Check if user exists, create if doesn't exist
//         let user = await User.findOne({ userId });
//         if (!user) {
//           user = new User({ userId });
//           await user.save();
//         }

//         // Check if taskName is unique for this user
//         const existingTask = await Task.findOne({ taskName, userId, isDeleted: false });
//         if (existingTask) {
//           throw new Error('Task name must be unique for this user');
//         }

//         // Create new task
//         const newTask = new Task({
//           taskName,
//           description,
//           isDone,
//           priority,
//           tags,
//           userId
//         });

//         const savedTask = await newTask.save();
//         return savedTask;
//       } catch (error) {
//         if (error.code === 11000) {
//           throw new Error('Task name must be unique for this user');
//         }
//         throw new Error(`Failed to create task: ${error.message}`);
//       }
//     },

//     // Update an existing task
//     updateTask: async (_, { input }) => {
//       try {
//         const { taskId, userId, taskName, description, isDone, priority, tags } = input;

//         // Check if user exists
//         const user = await User.findOne({ userId });
//         if (!user) {
//           throw new Error('User not found');
//         }

//         // Find the task
//         const task = await Task.findById(taskId);
//         if (!task) {
//           throw new Error('Task not found');
//         }

//         // Check if user owns the task
//         if (task.userId !== userId) {
//           throw new Error('Unauthorized: You can only update your own tasks');
//         }

//         // Check if task is deleted
//         if (task.isDeleted) {
//           throw new Error('Cannot update deleted task');
//         }

//         // Validate priority if provided
//         if (priority !== undefined && (priority < 1 || priority > 5)) {
//           throw new Error('Priority must be between 1 and 5');
//         }

//         // Validate description length if provided
//         if (description !== undefined && description.length < 10) {
//           throw new Error('Description must be at least 10 characters long');
//         }

//         // Validate description is not same as taskName if both are provided or being updated
//         const newTaskName = taskName !== undefined ? taskName : task.taskName;
//         const newDescription = description !== undefined ? description : task.description;
//         if (newDescription === newTaskName) {
//           throw new Error('Description cannot be the same as task name');
//         }

//         // Validate tags length if provided
//         if (tags !== undefined && tags.length > 5) {
//           throw new Error('Tags array cannot have more than 5 items');
//         }

//         // Check if new taskName is unique for this user (if taskName is being updated)
//         if (taskName !== undefined && taskName !== task.taskName) {
//           const existingTask = await Task.findOne({ 
//             taskName, 
//             userId, 
//             isDeleted: false,
//             _id: { $ne: taskId } // Exclude current task
//           });
//           if (existingTask) {
//             throw new Error('Task name must be unique for this user');
//           }
//         }

//         // Update fields
//         const updateFields = {};
//         if (taskName !== undefined) updateFields.taskName = taskName;
//         if (description !== undefined) updateFields.description = description;
//         if (isDone !== undefined) updateFields.isDone = isDone;
//         if (priority !== undefined) updateFields.priority = priority;
//         if (tags !== undefined) updateFields.tags = tags;

//         const updatedTask = await Task.findByIdAndUpdate(
//           taskId,
//           updateFields,
//           { new: true, runValidators: true }
//         );

//         return updatedTask;
//       } catch (error) {
//         if (error.code === 11000) {
//           throw new Error('Task name must be unique for this user');
//         }
//         throw new Error(`Failed to update task: ${error.message}`);
//       }
//     }
//   }
// };

// module.exports = resolvers;