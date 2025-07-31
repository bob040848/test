import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
    taskName: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      minlength: 10,
      trim: true
    },
    isDone: {
      type: Boolean,
      default: false
    },
    priority: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    tags: [{
      type: String,
      trim: true
    }],
    userId: {
      type: String,
      required: true
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  }, {
    timestamps: true,
  });
  
  taskSchema.index({ taskName: 1, userId: 1 }, { unique: true });
  
  taskSchema.pre('save', function(next) {
    if (this.tags && this.tags.length > 5) {
      const error = new Error('Tags array cannot have more than 5 items');
      return next(error);
    }
    
    if (this.description === this.taskName) {
      const error = new Error('Description cannot be the same as task name');
      return next(error);
    }
    
    next();
  });
  
  const Task = mongoose.model('Task', taskSchema);
  
  export default Task;