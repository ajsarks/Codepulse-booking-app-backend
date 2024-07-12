import mongoose from 'mongoose';

const timeRangeSchema = new mongoose.Schema({
  start: {
    type: String, // Time in format "HH:MM"
    required: true,
  },
  end: {
    type: String,
    required: true,
  }
});

const availabilitySchema = new mongoose.Schema({
  day: {
    type: String, // Day of the week
    required: true,
  },
  timeRanges: {
    type: [timeRangeSchema], // Array of time ranges
    required: true,
  }
});

const getDefaultAvailability = () => {
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const defaultTimeRanges = [{ start: '00:00', end: '23:59' }]; // Default to full day availability

  return daysOfWeek.map(day => ({
    day,
    timeRanges: defaultTimeRanges
  }));
};

const teamMemberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  monthsAvailable: {
    type: [Number], // Array of integers representing months (1-12)
    default: () => [...Array(12).keys()].map(i => i + 1), // Defaults to all months from 1 to 12
    required: true,
  },
  availability: {
    type: [availabilitySchema], // Array of availability objects
    default: getDefaultAvailability, // Use the helper function to set default availability
  },
  unavailableDates: {
    type: [Date], // Array of dates the team member is unavailable
    required: true,
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teams',
    required: true,
  }
});

export default mongoose.model('TeamMembers', teamMemberSchema);
