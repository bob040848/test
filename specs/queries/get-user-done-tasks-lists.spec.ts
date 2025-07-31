import { setupTestServer, teardownTestServer, clearDatabase, getTestClient } from '../testUtils';
import Task from '../../mongoose/models/task';
import User from '../../mongoose/models/user';

describe('getUserDoneTasksLists Query', () => {
  beforeAll(async () => { await setupTestServer(); });
  afterAll(async () => { await teardownTestServer(); });
  beforeEach(async () => { await clearDatabase(); const testUser = new User({ userId: 'user123' }); await testUser.save(); });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const GET_USER_DONE_TASKS = `
    query GetUserDoneTasksLists($userId: String!) {
      getUserDoneTasksLists(userId: $userId) {
        _id
        taskName
        description
        isDone
        priority
        userId
      }
    }
  `;

  it('should return completed tasks for user', async () => {
    const tasks = [
      new Task({ taskName: 'Completed Task 1', description: 'Description for completed task 1', priority: 3, userId: 'user123', isDone: true }),
      new Task({ taskName: 'Completed Task 2', description: 'Description for completed task 2', priority: 4, userId: 'user123', isDone: true }),
      new Task({ taskName: 'Incomplete Task', description: 'Description for incomplete task', priority: 2, userId: 'user123', isDone: false })
    ];
    await Task.insertMany(tasks);
    const { query } = getTestClient();
    const response = await query({ query: GET_USER_DONE_TASKS, variables: { userId: 'user123' } });
    expect(response.errors).toBeUndefined();
    expect(response.data.getUserDoneTasksLists.length).toBe(2);
    expect(response.data.getUserDoneTasksLists.every((task: any) => task.isDone && task.userId === 'user123')).toBe(true);
  });

  it('should fail when user does not exist', async () => {
    const { query } = getTestClient();
    const response = await query({ query: GET_USER_DONE_TASKS, variables: { userId: 'nonexistentuser' } });
    expect(response.errors).toBeDefined();
    expect(response.errors![0].message).toContain('User not found');
  });

  it('should return empty array when user has no completed tasks', async () => {
    const task = new Task({ taskName: 'Incomplete Task', description: 'Description for incomplete task', priority: 3, userId: 'user123', isDone: false });
    await task.save();
    const { query } = getTestClient();
    const response = await query({ query: GET_USER_DONE_TASKS, variables: { userId: 'user123' } });
    expect(response.errors).toBeUndefined();
    expect(response.data.getUserDoneTasksLists).toEqual([]);
  });

  it('should handle database query errors', async () => {
    const mockSort = jest.fn().mockRejectedValueOnce(new Error('Database connection failed'));
    const mockFind = jest.fn().mockReturnValueOnce({ sort: mockSort });
    jest.spyOn(Task, 'find').mockImplementationOnce(mockFind);
    
    const { query } = getTestClient();
    const response = await query({ query: GET_USER_DONE_TASKS, variables: { userId: 'user123' } });
    
    expect(response.errors).toBeDefined();
    expect(response.errors![0].message).toContain('Failed to fetch completed tasks: Database connection failed');
  });

  it('should handle non-Error exceptions in database query', async () => {
    const mockSort = jest.fn().mockRejectedValueOnce('String error occurred');
    const mockFind = jest.fn().mockReturnValueOnce({ sort: mockSort });
    jest.spyOn(Task, 'find').mockImplementationOnce(mockFind);
    
    const { query } = getTestClient();
    const response = await query({ query: GET_USER_DONE_TASKS, variables: { userId: 'user123' } });
    
    expect(response.errors).toBeDefined();
    expect(response.errors![0].message).toContain('Failed to fetch completed tasks: String error occurred');
  });
});