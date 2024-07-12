import mongoose from 'mongoose';
import TeamMember from '../models/TeamMembers.js';
import Booking from '../models/booking.js';


/**
 * Allocates two team members based on availability and least bookings
 * @param {Date} date - The date of the booking
 * @param {String} teamId - The team ID to which the team members belong
 * @returns {Promise<Array>} - Array of allocated team members
 */
async function allocateTeamMembers(date, teamId) {
  try {
    // Convert date to a day of the week (e.g., 'Monday')
    const dayOfWeek = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);

    // Convert the date to a month (1-12)
    const month = date.getMonth() + 1;

    // Find available team members
    const teamMembers = await TeamMember.find({
      team: teamId,
      monthsAvailable: month,
      unavailableDates: { $ne: date },
      availability: {
        $elemMatch: {
          day: dayOfWeek
        }
      }
    });

    if (teamMembers.length === 0) {
      throw new Error('No available team members found for the specified date.');
    }

    // For each team member, count their bookings for the given date
    const teamMembersWithBookings = await Promise.all(teamMembers.map(async (member) => {
      const bookings = await Booking.countDocuments({
        teamMember: member._id,
        date: date
      });
      return { member, bookings };
    }));

    // Sort team members by the number of bookings
    teamMembersWithBookings.sort((a, b) => a.bookings - b.bookings);

    // Return the top two team members with the least bookings
    const allocatedTeamMembers = teamMembersWithBookings.slice(0, 2).map(item => item.member);
    return allocatedTeamMembers;
  } catch (error) {
    console.error('Error allocating team members:', error);
    throw error;
  }
}

export default allocateTeamMembers;
