import { ApolloServer } from 'apollo-server-express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { typeDefs } from '../graphql/schemas';
import { resolvers } from '../graphql/resolvers';
import { createTestClient } from 'apollo-server-testing';
import Task from '../mongoose/models/task';
import User from '../mongoose/models/user';

let mongoServer: MongoMemoryServer;
let server: ApolloServer;
let testClient: ReturnType<typeof createTestClient>;

export const setupTestServer = async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
  server = new ApolloServer({ typeDefs, resolvers });
  testClient = createTestClient(server as any);
  return testClient;
};

export const teardownTestServer = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
};

export const clearDatabase = async () => {
  await Task.deleteMany({});
  await User.deleteMany({});
};

export const getTestClient = () => testClient;