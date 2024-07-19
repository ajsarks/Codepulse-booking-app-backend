import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  date: [{
    type: Date,
    required: true
  }],
  time: {
    type: String,
    required: true
  },
  teamMember: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TeamMembers',
    required: true
  }],
  classid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classes',
    required: true
  },
  phonenumber: {
    type: Number,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  isconfirmed: {
    type: Boolean,
    default: false
  },
  additionalcomments: {
    type: String,
  },
  classsetting: {
    type: String,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending'
  }
});

export default mongoose.model('Booking', bookingSchema);