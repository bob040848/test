import { sayHello } from "./mutations/say-hello";
import { addTask } from "./mutations/add-task";
import { updateTask } from "./mutations/update-task";
import { helloQuery } from "./queries/hello-query";
import { getAllTasks } from "./queries/get-all-tasks";
import { getUserDoneTasksLists } from "./queries/get-user-done-tasks-lists";
import { getFinishedTasksLists } from "./queries/get-finished-tasks-lists";

export const resolvers = {
  Query: {
    helloQuery,
    getAllTasks,
    getUserDoneTasksLists,
    getFinishedTasksLists,
  },
  Mutation: {
    sayHello,
    addTask,
    updateTask,
  },
};
