import { gql } from "graphql-tag";

export const typeDefs = gql`
  scalar Date

  type Task {
    _id: ID!
    taskName: String!
    description: String!
    isDone: Boolean!
    priority: Int!
    tags: [String!]
    createdAt: Date!
    updatedAt: Date!
    userId: String!
    isDeleted: Boolean!
  }

  type User {
    _id: ID!
    userId: String!
    name: String
    email: String
  }
  
  input AddTaskInput {
    taskName: String!
    description: String!
    isDone: Boolean = false
    priority: Int!
    tags: [String!]
    userId: String!
  }

  input UpdateTaskInput {
    taskId: ID!
    taskName: String
    description: String
    isDone: Boolean
    priority: Int
    tags: [String!]
    userId: String!
  }
  
  type Query {
    helloQuery: String!
    getAllTasks: [Task!]!
    getUserDoneTasksLists(userId: String!): [Task!]!
    getFinishedTasksLists(userId: String!): [Task!]!
    getUser(userId: String!): User!
  }

  type Mutation {
    sayHello(name: String!): String!
    addTask(input: AddTaskInput!): Task!
    updateTask(input: UpdateTaskInput!): Task!
  }
`;