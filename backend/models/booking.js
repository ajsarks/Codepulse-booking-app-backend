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
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^\(\d{3}\)\s\d{3}-\d{4}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number! Format should be (XXX) XXX-XXXX`
    }
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