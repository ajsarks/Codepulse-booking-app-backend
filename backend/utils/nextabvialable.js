import TeamMember from '../models/TeamMembers.js';

const findNextAvailableDate = async (teamId, requestedDate) => {
  try {
    const teamMembers = await TeamMember.find({ teamId });

    if (!teamMembers || teamMembers.length === 0) {
      throw new Error('No team members found for the provided team ID.');
    }

    let nextAvailableDate = null;
    let dateToCheck = new Date(requestedDate);

    // Check availability for the next 30 days
    for (let i = 0; i < 30; i++) {
      const isAvailable = teamMembers.every(member => {
        return !member.unavailableDates.some(date => date.getTime() === dateToCheck.getTime());
      });

      if (isAvailable) {
        nextAvailableDate = dateToCheck;
        break;
      }

      // Move to the next day
      dateToCheck.setDate(dateToCheck.getDate() + 1);
    }

    return nextAvailableDate;
  } catch (error) {
    console.error('Error finding next available date:', error);
    return null;
  }
};

export default findNextAvailableDate;