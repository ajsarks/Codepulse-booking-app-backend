import Booking from '../models/booking.js';
import getClosestTeam from '../utils/closestteam.js';
import allocateTeamMembers from '../utils/allocatemember.js';
import User from '../models/user.js';
import Class from '../models/classes.js'; // Renamed to avoid using the reserved keyword
import TeamMember from '../models/TeamMembers.js'; // Corrected import path
import schedule from 'node-schedule'; // Import node-schedule for scheduling jobs
import findNextAvailableDate from '../utils/nextabvialable.js'; // Corrected import path
import  sendEmail  from '../utils/email.js'; // Import the sendEmail function

export const createBooking = async (req, res) => {
  try {
    const { date, time, classid, location, userId, phonenumber, additionalcomments, classsetting } = req.body;

    if (!Array.isArray(date) || date.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of dates.' });
    }

    // Fetch the user by ID to get the name and email
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Fetch the class by ID to get associated teams
    const classData = await Class.findById(classid).populate('teams');
    if (!classData || classData.teams.length === 0) {
      return res.status(404).json({ message: 'No teams found for the provided class ID.' });
    }

    // Find the closest team based on the provided address
    const closestTeam = await getClosestTeam(location, classData.teams.map(team => team.address), 3600); // 60 minutes
    if (!closestTeam) {
      return res.status(404).json({ message: 'No team member found close to the provided location.' });
    }

    // Convert closestTeam address back to team ID
    const teamId = classData.teams.find(team => team.address === closestTeam.closestTeam)?._id;
    if (!teamId) {
      return res.status(404).json({ message: 'Team ID not found for closest team address.' });
    }

    const allocationErrors = [];
    let allocatedTeamMembers = []; // Define allocatedTeamMembers here

    for (const dateItem of date) {
      try {
        allocatedTeamMembers = await allocateTeamMembers(new Date(dateItem), teamId);
      } catch (allocationError) {
        console.error('Error allocating team members:', allocationError);
        const nextAvailableDate = await findNextAvailableDate(teamId, new Date(dateItem));
        allocationErrors.push({ date: dateItem, message: 'No team members available on the requested date.', nextAvailableDate });
        continue;
      }

      if (allocatedTeamMembers.length === 0) {
        // If no team members are available, find the next available date
        const nextAvailableDate = await findNextAvailableDate(teamId, new Date(dateItem));
        allocationErrors.push({ date: dateItem, message: 'No team members available on the requested date.', nextAvailableDate });
        continue;
      }
    }

    if (allocationErrors.length > 0) {
      return res.status(400).json({ message: 'No team members available on the requested dates.', allocationErrors });
    }

    // Fetch the class name
    const classDetails = await Class.findById(classid);
    const className = classDetails ? classDetails.name : 'Unknown Class';

    // Create the booking with 'name' from the payload
    const booking = new Booking({
      date, // Ensure this matches the schema field name
      time,
      teamMember: allocatedTeamMembers.map(member => member._id),
      classid,
      userId: user._id,
      name: user.name, // Use the name from the user document
      email: user.email, // Use the email from the user document
      location,
      phonenumber,
      additionalcomments,
      classsetting,
      isconfirmed: false, // Default value
      status: 'pending' // Default status
    }); 

    await booking.save();

    // Send email to the user
    const userSubject = 'Booking Created';
    const userText = `Dear ${user.name},\n\nYour booking has been created successfully.\n\nBooking Details:\nDate: ${date.join(', ')}\nTime: ${time}\nLocation: ${location}\nClass: ${className}\nPhone Number: ${phonenumber}\nAdditional Comments: ${additionalcomments}\nClass Setting: ${classsetting}\n\nThank you.`;
    await sendEmail(user.email, userSubject, userText);

    // Send email to the admin
    const adminEmail = process.env.EMAIL; // Use the email from .env
    const adminSubject = 'New Booking Created';
    const adminText = `A new booking has been created by ${user.name}.\n\nBooking Details:\nDate: ${date.join(', ')}\nTime: ${time}\nLocation: ${location}\nClass: ${className}\nPhone Number: ${phonenumber}\nAdditional Comments: ${additionalcomments}\nClass Setting: ${classsetting}`;
    await sendEmail(adminEmail, adminSubject, adminText);

    // Schedule automatic cancellation if booking is not confirmed two days before the first date
    const twoDaysBefore = new Date(date[0]);
    twoDaysBefore.setDate(twoDaysBefore.getDate() - 2);
    scheduleCancellation(booking._id, twoDaysBefore);

    // Update team members' unavailable dates
    allocatedTeamMembers.forEach(async (member) => {
      const teamMember = await TeamMember.findById(member._id);
      if (teamMember) {
        date.forEach(dateItem => {
          teamMember.unavailableDates.push(new Date(dateItem));
        });
        await teamMember.save();
      }
    });

    // Schedule booking deletion after six months
    const lastDate = new Date(date[date.length - 1]);
    scheduleBookingDeletion(booking._id, lastDate);

    res.status(201).json({ message: 'Booking created successfully.', booking });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Failed to create booking.', error: error.message });
  }
};

// Helper function to schedule cancellation
const scheduleCancellation = async (bookingId, cancellationDate) => {
  const job = schedule.scheduleJob(cancellationDate, async () => {
    const booking = await Booking.findById(bookingId);
    if (booking && booking.status === 'pending') {
      booking.status = 'cancelled';
      await booking.save();

      // Free team members' unavailable dates
      const teamMemberIds = booking.teamMember;
      teamMemberIds.forEach(async (memberId) => {
        const teamMember = await TeamMember.findById(memberId);
        if (teamMember) {
          booking.date.forEach(date => {
            const index = teamMember.unavailableDates.findIndex(d => d.getTime() === new Date(date).getTime());
            if (index !== -1) {
              teamMember.unavailableDates.splice(index, 1);
            }
          });
          await teamMember.save();
        }
      });

      console.log(`Booking ${bookingId} automatically canceled as it was not confirmed two days before the date.`);
    }
  });

  console.log(`Cancellation job scheduled for booking ${bookingId} on ${cancellationDate}.`);
};

// Helper function to schedule booking deletion
const scheduleBookingDeletion = (bookingId, lastDate) => {
  const sixMonthsLater = new Date(lastDate);
  sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

  schedule.scheduleJob(sixMonthsLater, async () => {
    try {
      const deletedBooking = await Booking.findByIdAndDelete(bookingId);
      if (deletedBooking) {
        console.log(`Booking ${bookingId} automatically deleted after six months.`);
      }
    } catch (error) {
      console.error(`Error deleting booking ${bookingId}:`, error);
    }
  });

  console.log(`Deletion scheduled for booking ${bookingId} on ${sixMonthsLater}.`);
};

export const updateBooking = async (req, res) => {
  try {
    const { date, time, classid, location, userId, phonenumber, additionalcomments, classsetting } = req.body;
    const bookingId = req.params.id;

    if (!Array.isArray(date) || date.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of dates.' });
    }

    // Fetch the user by ID to get the name and email
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Fetch the class by ID to get associated teams
    const classData = await Class.findById(classid).populate('teams');
    if (!classData || classData.teams.length === 0) {
      return res.status(404).json({ message: 'No teams found for the provided class ID.' });
    }

    // Find the closest team based on the provided address
    const closestTeam = await getClosestTeam(location, classData.teams.map(team => team.address), 3600); // 60 minutes
    if (!closestTeam) {
      return res.status(404).json({ message: 'No team member found close to the provided location.' });
    }

    // Convert closestTeam address back to team ID
    const teamId = classData.teams.find(team => team.address === closestTeam.closestTeam)?._id;
    if (!teamId) {
      return res.status(404).json({ message: 'Team ID not found for closest team address.' });
    }

    const allocationErrors = [];
    let allocatedTeamMembers = []; // Define allocatedTeamMembers here

    for (const dateItem of date) {
      try {
        allocatedTeamMembers = await allocateTeamMembers(new Date(dateItem), teamId);
      } catch (allocationError) {
        console.error('Error allocating team members:', allocationError);
        const nextAvailableDate = await findNextAvailableDate(teamId, new Date(dateItem));
        allocationErrors.push({ date: dateItem, message: 'No team members available on the requested date.', nextAvailableDate });
        continue;
      }

      if (allocatedTeamMembers.length === 0) {
        // If no team members are available, find the next available date
        const nextAvailableDate = await findNextAvailableDate(teamId, new Date(dateItem));
        allocationErrors.push({ date: dateItem, message: 'No team members available on the requested date.', nextAvailableDate });
        continue;
      }
    }

    if (allocationErrors.length > 0) {
      return res.status(400).json({ message: 'No team members available on the requested dates.', allocationErrors });
    }

    // Update the booking with new data
    const updatedBooking = await Booking.findByIdAndUpdate(bookingId, {
      date,
      time,
      teamMember: allocatedTeamMembers.map(member => member._id),
      classid,
      userId: user._id,
      name: user.name,
      email: user.email,
      location,
      phonenumber,
      additionalcomments,
      classsetting,
      isconfirmed: req.user.isAdmin, // Set isconfirmed based on admin status
      status: req.user.isAdmin ? 'confirmed' : 'pending' // Update status based on admin status
    }, { new: true, runValidators: true });

    if (!updatedBooking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    // If date or time changed, re-schedule the cancellation job
    const twoDaysBefore = new Date(date[0]);
    twoDaysBefore.setDate(twoDaysBefore.getDate() - 2);
    scheduleCancellation(updatedBooking._id, twoDaysBefore);

    res.status(200).json({ message: 'Booking updated successfully.', booking: updatedBooking });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ message: 'Failed to update booking.', error: error.message });
  }
};

export const confirmBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;

    // Find the booking by ID
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    // Mark the booking as confirmed
    booking.isconfirmed = true;
    booking.status = 'confirmed';
    await booking.save();

    // Fetch the class name
    const classDetails = await Class.findById(booking.classid);
    const className = classDetails ? classDetails.name : 'Unknown Class';

    // Send email to the user
    const userSubject = 'Booking Confirmed';
    const userText = `Dear ${booking.name},\n\nYour booking has been confirmed.\n\nBooking Details:\nDate: ${booking.date.join(', ')}\nTime: ${booking.time}\nLocation: ${booking.location}\nClass: ${className}\nPhone Number: ${booking.phonenumber}\nAdditional Comments: ${booking.additionalcomments}\nClass Setting: ${booking.classsetting}\n\nThank you.`;
    await sendEmail(booking.email, userSubject, userText);

    // Send email to the admin
    const adminEmail = process.env.EMAIL; // Use the email from .env
    const adminSubject = 'Booking Confirmed';
    const adminText = `The booking by ${booking.name} has been confirmed.\n\nBooking Details:\nDate: ${booking.date.join(', ')}\nTime: ${booking.time}\nLocation: ${booking.location}\nClass: ${className}\nPhone Number: ${booking.phonenumber}\nAdditional Comments: ${booking.additionalcomments}\nClass Setting: ${booking.classsetting}`;
    await sendEmail(adminEmail, adminSubject, adminText);

    res.status(200).json({ message: 'Booking confirmed successfully.', booking });
  } catch (error) {
    console.error('Error confirming booking:', error);
    res.status(500).json({ message: 'Failed to confirm booking.', error: error.message });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;

    // Find the booking by ID
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    // Mark the booking as cancelled
    booking.status = 'cancelled';
    await booking.save();

    // Free team members' unavailable dates
    const teamMemberIds = booking.teamMember;
    teamMemberIds.forEach(async (memberId) => {
      const teamMember = await TeamMember.findById(memberId);
      if (teamMember) {
        booking.date.forEach(date => {
          const index = teamMember.unavailableDates.findIndex(d => d.getTime() === new Date(date).getTime());
          if (index !== -1) {
            teamMember.unavailableDates.splice(index, 1);
          }
        });
        await teamMember.save();
      }
    });

    // Fetch the class name
    const classDetails = await Class.findById(booking.classid);
    const className = classDetails ? classDetails.name : 'Unknown Class';

    // Send email to the user
    const userSubject = 'Booking Cancelled';
    const userText = `Dear ${booking.name},\n\nYour booking has been cancelled.\n\nBooking Details:\nDate: ${booking.date.join(', ')}\nTime: ${booking.time}\nLocation: ${booking.location}\nClass: ${className}\nPhone Number: ${booking.phonenumber}\nAdditional Comments: ${booking.additionalcomments}\nClass Setting: ${booking.classsetting}\n\nThank you.`;
    await sendEmail(booking.email, userSubject, userText);

    // Send email to the admin
    const adminEmail = process.env.EMAIL; // Use the email from .env
    const adminSubject = 'Booking Cancelled';
    const adminText = `The booking by ${booking.name} has been cancelled.\n\nBooking Details:\nDate: ${booking.date.join(', ')}\nTime: ${booking.time}\nLocation: ${booking.location}\nClass: ${className}\nPhone Number: ${booking.phonenumber}\nAdditional Comments: ${booking.additionalcomments}\nClass Setting: ${booking.classsetting}`;
    await sendEmail(adminEmail, adminSubject, adminText);

    res.status(200).json({ message: 'Booking cancelled successfully.', booking });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ message: 'Failed to cancel booking.', error: error.message });
  }
};

export const deleteBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;

    // Find the booking by ID and delete it
    const booking = await Booking.findByIdAndDelete(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    // Free team members' unavailable dates
    const bookingDate = new Date(booking.date[0]);
    const teamMemberIds = booking.teamMember;

    for (const memberId of teamMemberIds) {
      const teamMember = await TeamMember.findById(memberId); // Corrected import path
      if (teamMember) {
        const index = teamMember.unavailableDates.findIndex(date => date.getTime() === bookingDate.getTime());
        if (index !== -1) {
          teamMember.unavailableDates.splice(index, 1);
          await teamMember.save();
        }
      }
    }

    res.status(200).json({ message: 'Booking deleted successfully.', booking });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ message: 'Failed to delete booking.', error: error.message });
  }
};

// New controller to get all bookings
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find();
    res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching all bookings:', error);
    res.status(500).json({ message: 'Failed to fetch bookings.', error: error.message });
  }
};

// New controller to get booking by ID
export const getBookingById = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }
    res.status(200).json(booking);
  } catch (error) {
    console.error('Error fetching booking by ID:', error);
    res.status(500).json({ message: 'Failed to fetch booking.', error: error.message });
  }
};

export const getBookingsByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;
    const bookings = await Booking.find({ userId });
    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ message: 'No bookings found for the provided user ID.' });
    }
    res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching bookings by user ID:', error);
    res.status(500).json({ message: 'Failed to fetch bookings.', error: error.message });
  }
};