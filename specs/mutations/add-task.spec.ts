import { setupTestServer, teardownTestServer, clearDatabase, getTestClient } from '../testUtils';
import Task from '../../mongoose/models/task';
import User from '../../mongoose/models/user';

describe('addTask Mutation', () => {
  beforeAll(async () => { await setupTestServer(); });
  afterAll(async () => { await teardownTestServer(); });
  beforeEach(async () => { await clearDatabase(); });

  const ADD_TASK = `
    mutation AddTask($input: AddTaskInput!) {
      addTask(input: $input) {
        _id
        taskName
        description
        isDone
        priority
        tags
        userId
        createdAt
        updatedAt
      }
    }
  `;

  it('should create a new task successfully', async () => {
    const input = {
      taskName: 'Test Task',
      description: 'This is a test task description',
      priority: 3,
      tags: ['work', 'urgent'],
      userId: 'user123'
    };
    const { mutate } = getTestClient();
    const response = await mutate({ mutation: ADD_TASK, variables: { input } });
    expect(response.errors).toBeUndefined();
    expect(response.data.addTask).toMatchObject({
      taskName: input.taskName,
      description: input.description,
      isDone: false,
      priority: input.priority,
      tags: input.tags,
      userId: input.userId
    });
    expect(response.data.addTask._id).toBeDefined();
    expect(response.data.addTask.createdAt).toBeDefined();
    expect(response.data.addTask.updatedAt).toBeDefined();
  });

  it('should create task with isDone explicitly set to true', async () => {
    const input = {
      taskName: 'Done Task',
      description: 'This task is already done',
      priority: 3,
      isDone: true,
      userId: 'user123'
    };
    const { mutate } = getTestClient();
    const response = await mutate({ mutation: ADD_TASK, variables: { input } });
    expect(response.errors).toBeUndefined();
    expect(response.data.addTask.isDone).toBe(true);
  });

  it('should create task without tags (empty array)', async () => {
    const input = {
      taskName: 'No Tags Task',
      description: 'This task has no tags',
      priority: 3,
      userId: 'user123'
    };
    const { mutate } = getTestClient();
    const response = await mutate({ mutation: ADD_TASK, variables: { input } });
    expect(response.errors).toBeUndefined();
    expect(response.data.addTask.tags).toEqual([]);
  });

  it('should fail with priority less than 1', async () => {
    const input = {
      taskName: 'Test Task',
      description: 'This is a test task description',
      priority: 0, // Invalid
      userId: 'user123'
    };
    const { mutate } = getTestClient();
    const response = await mutate({ mutation: ADD_TASK, variables: { input } });
    expect(response.errors).toBeDefined();
    expect(response.errors![0].message).toContain('Priority must be between 1 and 5');
  });

  it('should fail with invalid priority', async () => {
    const input = {
      taskName: 'Test Task',
      description: 'This is a test task description',
      priority: 6, // Invalid
      userId: 'user123'
    };
    const { mutate } = getTestClient();
    const response = await mutate({ mutation: ADD_TASK, variables: { input } });
    expect(response.errors).toBeDefined();
    expect(response.errors![0].message).toContain('Priority must be between 1 and 5');
  });

  it('should fail with short description', async () => {
    const input = {
      taskName: 'Test Task',
      description: 'Short',
      priority: 3,
      userId: 'user123'
    };
    const { mutate } = getTestClient();
    const response = await mutate({ mutation: ADD_TASK, variables: { input } });
    expect(response.errors).toBeDefined();
    expect(response.errors![0].message).toContain('Description must be at least 10 characters long');
  });

  it('should fail when description equals taskName', async () => {
    const input = {
      taskName: 'Test Task Name',
      description: 'Test Task Name',
      priority: 3,
      userId: 'user123'
    };
    const { mutate } = getTestClient();
    const response = await mutate({ mutation: ADD_TASK, variables: { input } });
    expect(response.errors).toBeDefined();
    expect(response.errors![0].message).toContain('Description cannot be the same as task name');
  });

  it('should fail with too many tags', async () => {
    const input = {
      taskName: 'Test Task',
      description: 'This is a test task description',
      priority: 3,
      tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6'],
      userId: 'user123'
    };
    const { mutate } = getTestClient();
    const response = await mutate({ mutation: ADD_TASK, variables: { input } });
    expect(response.errors).toBeDefined();
    expect(response.errors![0].message).toContain('Tags array cannot have more than 5 items');
  });

  it('should fail when taskName is not unique for user', async () => {
    const input1 = {
      taskName: 'Duplicate Task',
      description: 'First task description',
      priority: 3,
      userId: 'user123'
    };
    const input2 = {
      taskName: 'Duplicate Task',
      description: 'Second task description',
      priority: 4,
      userId: 'user123'
    };
    const { mutate } = getTestClient();
    await mutate({ mutation: ADD_TASK, variables: { input: input1 } });
    const response = await mutate({ mutation: ADD_TASK, variables: { input: input2 } });
    expect(response.errors).toBeDefined();
    expect(response.errors![0].message).toContain('Task name must be unique for this user');
  });

  it('should handle MongoDB duplicate key error (E11000)', async () => {
    const duplicateError = new Error('Duplicate key error');
    (duplicateError as any).message = 'E11000 duplicate key error';
    
    jest.spyOn(Task.prototype, 'save').mockRejectedValueOnce(duplicateError);
    
    const input = {
      taskName: 'Test Task',
      description: 'This is a test task description',
      priority: 3,
      userId: 'user123'
    };
    
    const { mutate } = getTestClient();
    const response = await mutate({ mutation: ADD_TASK, variables: { input } });
    
    expect(response.errors).toBeDefined();
    expect(response.errors![0].message).toContain('Task name must be unique for this user');
  });

  // FIXED TEST: This test should now match the actual behavior
  it('should handle non-Error exception with instanceof Error check', async () => {
    // Create an error-like object that is NOT an instance of Error
    const nonErrorException = {
      message: 'E11000 duplicate key error but not Error instance',
      toString: () => 'E11000 duplicate key error but not Error instance'
    };
    
    jest.spyOn(Task.prototype, 'save').mockRejectedValueOnce(nonErrorException);
    
    const input = {
      taskName: 'Test Task',
      description: 'This is a test task description',
      priority: 3,
      userId: 'user123'
    };
    
    const { mutate } = getTestClient();
    const response = await mutate({ mutation: ADD_TASK, variables: { input } });
    
    expect(response.errors).toBeDefined();
    // The error should contain the string representation since it has E11000 but is not instanceof Error
    expect(response.errors![0].message).toContain('Failed to create task: E11000 duplicate key error but not Error instance');
  });

  // NEW TEST: This will cover the missing branch where error is instanceof Error but doesn't contain E11000
  it('should handle Error instance without E11000', async () => {
    const genericError = new Error('Some other database error');
    
    jest.spyOn(Task.prototype, 'save').mockRejectedValueOnce(genericError);
    
    const input = {
      taskName: 'Test Task',
      description: 'This is a test task description',
      priority: 3,
      userId: 'user123'
    };
    
    const { mutate } = getTestClient();
    const response = await mutate({ mutation: ADD_TASK, variables: { input } });
    
    expect(response.errors).toBeDefined();
    expect(response.errors![0].message).toContain('Failed to create task: Some other database error');
  });

  it('should handle generic error during task creation', async () => {
    const genericError = new Error('Generic save error');
    
    jest.spyOn(Task.prototype, 'save').mockRejectedValueOnce(genericError);
    
    const input = {
      taskName: 'Test Task',
      description: 'This is a test task description',
      priority: 3,
      userId: 'user123'
    };
    
    const { mutate } = getTestClient();
    const response = await mutate({ mutation: ADD_TASK, variables: { input } });
    
    expect(response.errors).toBeDefined();
    expect(response.errors![0].message).toContain('Failed to create task: Generic save error');
  });

  it('should handle non-Error exceptions', async () => {
    jest.spyOn(Task.prototype, 'save').mockRejectedValueOnce('String error');
    
    const input = {
      taskName: 'Test Task',
      description: 'This is a test task description',
      priority: 3,
      userId: 'user123'
    };
    
    const { mutate } = getTestClient();
    const response = await mutate({ mutation: ADD_TASK, variables: { input } });
    
    expect(response.errors).toBeDefined();
    expect(response.errors![0].message).toContain('Failed to create task: String error');
  });

  it('should allow same taskName for different users', async () => {
    const input1 = {
      taskName: 'Same Task Name',
      description: 'First user task description',
      priority: 3,
      userId: 'user123'
    };
    const input2 = {
      taskName: 'Same Task Name',
      description: 'Second user task description',
      priority: 4,
      userId: 'user456'
    };
    const { mutate } = getTestClient();
    const response1 = await mutate({ mutation: ADD_TASK, variables: { input: input1 } });
    const response2 = await mutate({ mutation: ADD_TASK, variables: { input: input2 } });
    expect(response1.errors).toBeUndefined();
    expect(response2.errors).toBeUndefined();
    expect(response1.data.addTask.taskName).toBe('Same Task Name');
    expect(response2.data.addTask.taskName).toBe('Same Task Name');
  });

  it('should create user if user does not exist', async () => {
    const input = {
      taskName: 'Test Task for New User',
      description: 'This is a test task for a new user',
      priority: 3,
      userId: 'newuser456'
    };
    
    // Verify user doesn't exist
    const userBefore = await User.findOne({ userId: 'newuser456' });
    expect(userBefore).toBeNull();
    
    const { mutate } = getTestClient();
    const response = await mutate({ mutation: ADD_TASK, variables: { input } });
    
    expect(response.errors).toBeUndefined();
    expect(response.data.addTask.userId).toBe('newuser456');
    
    const userAfter = await User.findOne({ userId: 'newuser456' });
    expect(userAfter).not.toBeNull();
    expect(userAfter!.userId).toBe('newuser456');
  });
});