import { setupTestServer, teardownTestServer, clearDatabase, getTestClient } from '../testUtils';
import Task from '../../mongoose/models/task';
import User from '../../mongoose/models/user';
import mongoose from 'mongoose';

describe('updateTask Mutation', () => {
  let testTask: any;
  let testUser: any;

  beforeAll(async () => { await setupTestServer(); });
  afterAll(async () => { await teardownTestServer(); });
  beforeEach(async () => {
    await clearDatabase();
    testUser = new User({ userId: 'user123' });
    await testUser.save();
    testTask = new Task({
      taskName: 'Original Task',
      description: 'Original description for testing',
      priority: 3,
      tags: ['original'],
      userId: 'user123'
    });
    await testTask.save();
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const UPDATE_TASK = `
    mutation UpdateTask($input: UpdateTaskInput!) {
      updateTask(input: $input) {
        _id
        taskName
        description
        isDone
        priority
        tags
        userId
        updatedAt
      }
    }
  `;
  
  it('should update only specific fields when provided', async () => {
    const input1 = {
      taskId: testTask._id.toString(),
      isDone: true,
      userId: 'user123'
    };
    
    const { mutate } = getTestClient();
    const response1 = await mutate({ mutation: UPDATE_TASK, variables: { input: input1 } });
    
    expect(response1.errors).toBeUndefined();
    expect(response1.data.updateTask.isDone).toBe(true);
    expect(response1.data.updateTask.taskName).toBe('Original Task'); // Should remain unchanged
  });
  
  it('should update only tags when provided', async () => {
    const input = {
      taskId: testTask._id.toString(),
      tags: ['new-tag'],
      userId: 'user123'
    };
    
    const { mutate } = getTestClient();
    const response = await mutate({ mutation: UPDATE_TASK, variables: { input } });
    
    expect(response.errors).toBeUndefined();
    expect(response.data.updateTask.tags).toEqual(['new-tag']);
  });

  it('should update task successfully', async () => {
    const input = {
      taskId: testTask._id.toString(),
      taskName: 'Updated Task',
      description: 'Updated description for testing',
      isDone: true,
      priority: 5,
      tags: ['updated', 'test'],
      userId: 'user123'
    };
    const { mutate } = getTestClient();
    const response = await mutate({ mutation: UPDATE_TASK, variables: { input } });
    expect(response.errors).toBeUndefined();
    expect(response.data.updateTask).toMatchObject({
      taskName: input.taskName,
      description: input.description,
      isDone: input.isDone,
      priority: input.priority,
      tags: input.tags,
      userId: input.userId
    });
  });

  it('should fail when user does not exist', async () => {
    const input = {
      taskId: testTask._id.toString(),
      taskName: 'Updated Task',
      userId: 'nonexistentuser'
    };
    const { mutate } = getTestClient();
    const response = await mutate({ mutation: UPDATE_TASK, variables: { input } });
    expect(response.errors).toBeDefined();
    expect(response.errors![0].message).toContain('User not found');
  });

  it('should fail when task does not exist', async () => {
    const input = {
      taskId: new mongoose.Types.ObjectId().toString(),
      taskName: 'Updated Task',
      userId: 'user123'
    };
    const { mutate } = getTestClient();
    const response = await mutate({ mutation: UPDATE_TASK, variables: { input } });
    expect(response.errors).toBeDefined();
    expect(response.errors![0].message).toContain('Task not found');
  });

  it('should fail when user does not own the task', async () => {
    const anotherUser = new User({ userId: 'user456' });
    await anotherUser.save();
    const input = {
      taskId: testTask._id.toString(),
      taskName: 'Updated Task',
      userId: 'user456'
    };
    const { mutate } = getTestClient();
    const response = await mutate({ mutation: UPDATE_TASK, variables: { input } });
    expect(response.errors).toBeDefined();
    expect(response.errors![0].message).toContain('Unauthorized: You can only update your own tasks');
  });

  it('should fail when trying to update deleted task', async () => {
    const deletedTask = new Task({
      taskName: 'Deleted Task',
      description: 'This task is deleted',
      priority: 3,
      userId: 'user123',
      isDeleted: true
    });
    await deletedTask.save();

    const input = {
      taskId: deletedTask._id.toString(),
      taskName: 'Updated Deleted Task',
      userId: 'user123'
    };
    const { mutate } = getTestClient();
    const response = await mutate({ mutation: UPDATE_TASK, variables: { input } });
    expect(response.errors).toBeDefined();
    expect(response.errors![0].message).toContain('Cannot update deleted task');
  });

  it('should fail with priority less than 1', async () => {
    const input = {
      taskId: testTask._id.toString(),
      priority: 0,
      userId: 'user123'
    };
    const { mutate } = getTestClient();
    const response = await mutate({ mutation: UPDATE_TASK, variables: { input } });
    expect(response.errors).toBeDefined();
    expect(response.errors![0].message).toContain('Priority must be between 1 and 5');
  });

  it('should fail with invalid priority', async () => {
    const input = {
      taskId: testTask._id.toString(),
      priority: 6,
      userId: 'user123'
    };
    const { mutate } = getTestClient();
    const response = await mutate({ mutation: UPDATE_TASK, variables: { input } });
    expect(response.errors).toBeDefined();
    expect(response.errors![0].message).toContain('Priority must be between 1 and 5');
  });

  it('should fail with short description', async () => {
    const input = {
      taskId: testTask._id.toString(),
      description: 'Short',
      userId: 'user123'
    };
    const { mutate } = getTestClient();
    const response = await mutate({ mutation: UPDATE_TASK, variables: { input } });
    expect(response.errors).toBeDefined();
    expect(response.errors![0].message).toContain('Description must be at least 10 characters long');
  });

  it('should fail when new description equals new taskName', async () => {
    const input = {
      taskId: testTask._id.toString(),
      taskName: 'Same Name Desc',
      description: 'Same Name Desc',
      userId: 'user123'
    };
    const { mutate } = getTestClient();
    const response = await mutate({ mutation: UPDATE_TASK, variables: { input } });
    expect(response.errors).toBeDefined();
    expect(response.errors![0].message).toContain('Description cannot be the same as task name');
  });

  it('should fail when new description equals existing taskName', async () => {
    const input = {
      taskId: testTask._id.toString(),
      description: 'Original Task', // Same as existing taskName
      userId: 'user123'
    };
    const { mutate } = getTestClient();
    const response = await mutate({ mutation: UPDATE_TASK, variables: { input } });
    expect(response.errors).toBeDefined();
    expect(response.errors![0].message).toContain('Description cannot be the same as task name');
  });

  it('should fail when new taskName equals existing description', async () => {
    const input = {
      taskId: testTask._id.toString(),
      taskName: 'Original description for testing', // Same as existing description
      userId: 'user123'
    };
    const { mutate } = getTestClient();
    const response = await mutate({ mutation: UPDATE_TASK, variables: { input } });
    expect(response.errors).toBeDefined();
    expect(response.errors![0].message).toContain('Description cannot be the same as task name');
  });

  it('should fail with too many tags', async () => {
    const input = {
      taskId: testTask._id.toString(),
      tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6'],
      userId: 'user123'
    };
    const { mutate } = getTestClient();
    const response = await mutate({ mutation: UPDATE_TASK, variables: { input } });
    expect(response.errors).toBeDefined();
    expect(response.errors![0].message).toContain('Tags array cannot have more than 5 items');
  });

  it('should handle MongoDB duplicate key error on update', async () => {
    const duplicateError = new Error('Duplicate key error');
    (duplicateError as any).code = 11000;
    
    jest.spyOn(Task, 'findByIdAndUpdate').mockRejectedValueOnce(duplicateError);
    
    const input = {
      taskId: testTask._id.toString(),
      taskName: 'Updated Task',
      userId: 'user123'
    };
    
    const { mutate } = getTestClient();
    const response = await mutate({ mutation: UPDATE_TASK, variables: { input } });
    
    expect(response.errors).toBeDefined();
    expect(response.errors![0].message).toContain('Task name must be unique for this user');
  });

  it('should handle MongoDB duplicate key error with E11000 message', async () => {
    const duplicateError = new Error('E11000 duplicate key error');
    
    jest.spyOn(Task, 'findByIdAndUpdate').mockRejectedValueOnce(duplicateError);
    
    const input = {
      taskId: testTask._id.toString(),
      taskName: 'Updated Task',
      userId: 'user123'
    };
    
    const { mutate } = getTestClient();
    const response = await mutate({ mutation: UPDATE_TASK, variables: { input } });
    
    expect(response.errors).toBeDefined();
    expect(response.errors![0].message).toContain('Task name must be unique for this user');
  });

  it('should handle MongoDB duplicate key error with duplicate key message', async () => {
    const duplicateError = new Error('Some duplicate key error occurred');
    
    jest.spyOn(Task, 'findByIdAndUpdate').mockRejectedValueOnce(duplicateError);
    
    const input = {
      taskId: testTask._id.toString(),
      taskName: 'Updated Task',
      userId: 'user123'
    };
    
    const { mutate } = getTestClient();
    const response = await mutate({ mutation: UPDATE_TASK, variables: { input } });
    
    expect(response.errors).toBeDefined();
    expect(response.errors![0].message).toContain('Task name must be unique for this user');
  });

  it('should handle generic error during task update', async () => {
    const genericError = new Error('Generic update error');
    
    jest.spyOn(Task, 'findByIdAndUpdate').mockRejectedValueOnce(genericError);
    
    const input = {
      taskId: testTask._id.toString(),
      taskName: 'Updated Task',
      userId: 'user123'
    };
    
    const { mutate } = getTestClient();
    const response = await mutate({ mutation: UPDATE_TASK, variables: { input } });
    
    expect(response.errors).toBeDefined();
    expect(response.errors![0].message).toContain('Failed to update task: Generic update error');
  });

  it('should handle non-Error exceptions', async () => {
    jest.spyOn(Task, 'findByIdAndUpdate').mockRejectedValueOnce('String error');
    
    const input = {
      taskId: testTask._id.toString(),
      taskName: 'Updated Task',
      userId: 'user123'
    };
    
    const { mutate } = getTestClient();
    const response = await mutate({ mutation: UPDATE_TASK, variables: { input } });
    
    expect(response.errors).toBeDefined();
    expect(response.errors![0].message).toContain('Failed to update task: String error');
  });

  it('should fail with duplicate taskName for same user', async () => {
    const anotherTask = new Task({
      taskName: 'Another Task',
      description: 'Another task description',
      priority: 2,
      userId: 'user123'
    });
    await anotherTask.save();
    const input = {
      taskId: testTask._id.toString(),
      taskName: 'Another Task',
      userId: 'user123'
    };
    const { mutate } = getTestClient();
    const response = await mutate({ mutation: UPDATE_TASK, variables: { input } });
    expect(response.errors).toBeDefined();
    expect(response.errors![0].message).toContain('Task name must be unique for this user');
  });

  it('should allow updating to same taskName (no change)', async () => {
    const input = {
      taskId: testTask._id.toString(),
      taskName: 'Original Task', // Same as current taskName
      description: 'Updated description here',
      userId: 'user123'
    };
    const { mutate } = getTestClient();
    const response = await mutate({ mutation: UPDATE_TASK, variables: { input } });
    expect(response.errors).toBeUndefined();
    expect(response.data.updateTask.taskName).toBe('Original Task');
    expect(response.data.updateTask.description).toBe('Updated description here');
  });
});