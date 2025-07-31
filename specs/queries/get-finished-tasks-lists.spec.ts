import { setupTestServer, teardownTestServer, clearDatabase, getTestClient } from '../testUtils';
import Task from '../../mongoose/models/task';
import User from '../../mongoose/models/user';

describe('getFinishedTasksLists Query', () => {
  beforeAll(async () => { await setupTestServer(); });
  afterAll(async () => { await teardownTestServer(); });
  beforeEach(async () => { await clearDatabase(); const testUser = new User({ userId: 'user123' }); await testUser.save(); });

  const GET_FINISHED_TASKS = `
    query GetFinishedTasksLists($userId: String!) {
      getFinishedTasksLists(userId: $userId) {
        _id
        taskName
        description
        isDone
        priority
        userId
        isDeleted
      }
    }
  `;

  it('should return deleted tasks for user', async () => {
    const tasks = [
      new Task({ taskName: 'Active Task', description: 'Description for active task', priority: 3, userId: 'user123', isDeleted: false }),
      new Task({ taskName: 'Deleted Task 1', description: 'Description for deleted task 1', priority: 2, userId: 'user123', isDeleted: true }),
      new Task({ taskName: 'Deleted Task 2', description: 'Description for deleted task 2', priority: 4, userId: 'user123', isDeleted: true }),
      new Task({ taskName: 'Other User Deleted Task', description: 'Description for other user deleted task', priority: 3, userId: 'user456', isDeleted: true })
    ];
    await Task.insertMany(tasks);
    const { query } = getTestClient();
    const response = await query({ query: GET_FINISHED_TASKS, variables: { userId: 'user123' } });
    expect(response.errors).toBeUndefined();
    expect(response.data.getFinishedTasksLists.length).toBe(2);
    expect(response.data.getFinishedTasksLists.every((task: any) => task.isDeleted && task.userId === 'user123')).toBe(true);
  });

  it('should fail when user does not exist', async () => {
    const { query } = getTestClient();
    const response = await query({ query: GET_FINISHED_TASKS, variables: { userId: 'nonexistentuser' } });
    expect(response.errors).toBeDefined();
    expect(response.errors![0].message).toContain('User not found');
  });

  it('should return empty array when user has no deleted tasks', async () => {
    const task = new Task({ taskName: 'Active Task', description: 'Description for active task', priority: 3, userId: 'user123', isDeleted: false });
    await task.save();
    const { query } = getTestClient();
    const response = await query({ query: GET_FINISHED_TASKS, variables: { userId: 'user123' } });
    expect(response.errors).toBeUndefined();
    expect(response.data.getFinishedTasksLists).toEqual([]);
  });

});