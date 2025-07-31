import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

export default User;