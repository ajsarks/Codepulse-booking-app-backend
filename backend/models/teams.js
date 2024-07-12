import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  teamMembers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TeamMembers',
  }],
});

export default mongoose.model('Teams', teamSchema);
