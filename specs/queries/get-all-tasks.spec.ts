import { setupTestServer, teardownTestServer, clearDatabase, getTestClient } from '../testUtils';
import Task from '../../mongoose/models/task';

describe('getAllTasks Query', () => {
  beforeAll(async () => { await setupTestServer(); });
  afterAll(async () => { await teardownTestServer(); });
  beforeEach(async () => { await clearDatabase(); });
  afterEach(() => {
    // Restore all mocks after each test to prevent interference
    jest.restoreAllMocks();
  });

  const GET_ALL_TASKS = `
    query GetAllTasks {
      getAllTasks {
        _id
        taskName
        description
        isDone
        priority
        tags
        userId
      }
    }
  `;

  it('should return empty array when no tasks exist', async () => {
    const { query } = getTestClient();
    const response = await query({ query: GET_ALL_TASKS });
    expect(response.errors).toBeUndefined();
    expect(response.data.getAllTasks).toEqual([]);
  });

  it('should return all active tasks', async () => {
    const tasks = [
      new Task({ taskName: 'Incomplete Task', description: 'Description for incomplete task', priority: 2, userId: 'user123', isDone: false }),
      new Task({ taskName: 'Completed Task 2', description: 'Description for completed task 2', priority: 4, userId: 'user123', isDone: true }),
      new Task({ taskName: 'Other User Task', description: 'Description for other user task', priority: 3, userId: 'user456', isDone: true })
    ];
    await Task.insertMany(tasks);
    const { query } = getTestClient();
    const response = await query({ query: GET_ALL_TASKS });
    expect(response.errors).toBeUndefined();
    expect(response.data.getAllTasks.length).toBe(3);
  });
  
  it('should handle database query errors', async () => {
    // Mock Task.find to return a chainable object with sort method
    const mockSort = jest.fn().mockRejectedValueOnce(new Error('Database query failed'));
    const mockFind = jest.fn().mockReturnValueOnce({ sort: mockSort });
    jest.spyOn(Task, 'find').mockImplementationOnce(mockFind);
    
    const { query } = getTestClient();
    const response = await query({ query: GET_ALL_TASKS });
    
    expect(response.errors).toBeDefined();
    expect(response.errors![0].message).toContain('Failed to fetch tasks');
  });

  it('should exclude deleted tasks', async () => {
    const tasks = [
      new Task({ taskName: 'Active Task', description: 'Description for active task', priority: 2, userId: 'user123', isDone: false, isDeleted: false }),
      new Task({ taskName: 'Deleted Task', description: 'Description for deleted task', priority: 4, userId: 'user123', isDone: true, isDeleted: true })
    ];
    await Task.insertMany(tasks);
    const { query } = getTestClient();
    const response = await query({ query: GET_ALL_TASKS });
    expect(response.errors).toBeUndefined();
    expect(response.data.getAllTasks.length).toBe(1);
    expect(response.data.getAllTasks[0].taskName).toBe('Active Task');
  });
});