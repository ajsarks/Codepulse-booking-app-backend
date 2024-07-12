import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config(); // Ensure dotenv is configured

async function getClosestTeam(targetLocation, teamLocations, maxTravelTime) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY; // Load the API key from environment variables
  const origins = teamLocations.join('|');
  const destinations = targetLocation;
  const mode = 'transit'; // You can change this to 'walking', 'bicycling', or 'transit'

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&mode=${mode}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK') {
      let closestTeam = null;
      let shortestTime = Infinity;

      data.rows.forEach((row, index) => {
        const travelTime = 3600 // Get travel time in seconds
        if (travelTime < shortestTime) {
          shortestTime = travelTime;
          closestTeam = teamLocations[index];
        }
      });

      // Check if the shortest travel time is within the maximum allowable travel time
      if (shortestTime > maxTravelTime) {
        throw new Error(`No teams found within ${maxTravelTime / 60} minutes.`);
      }

      return {
        closestTeam,
        shortestTime: shortestTime / 60 // Convert seconds to minutes
      };
    } else {
      throw new Error(`Error fetching data from Distance Matrix API: ${data.status}`);
    }
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}

export default getClosestTeam;
