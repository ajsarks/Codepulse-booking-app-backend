import mongoose from 'mongoose';

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
    lowercase: true, // Standardize to lowercase for consistent searching
  },
  type: {
    type: String,
    required: true,
  },
  daysrequired: {
    type: Number,
    required: true,
  },
  oneLiner: {
    type: String,
  },
  supplies: {
    type: String,
    required: true,
  },
  photos: {
    type: [String],
  },
  teams: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teams',
  }],
});

export default mongoose.model('Class', classSchema);
