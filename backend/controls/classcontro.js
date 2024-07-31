import axios from 'axios';
import Class from '../models/classes.js';
import Teams from '../models/teams.js';
import { createError } from '../utils/error.js';

// Helper function to fetch team IDs from team names
const getTeamIds = async (teamNames) => {
  const teams = await Teams.find({ name: { $in: teamNames } });
  const teamIds = teams.map(team => team._id);
  return teamIds;
};

// Function to fetch cities within a 10km radius
const getNearbyCities = async (city) => {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&addressdetails=1&limit=1`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'YourAppName/1.0 (your@email.com)'
      }
    });
    
    if (response.data && response.data.length > 0) {
      const { lat, lon } = response.data[0];

      const nearbyUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`;
      const nearbyResponse = await axios.get(nearbyUrl, {
        headers: {
          'User-Agent': 'YourAppName/1.0 (your@email.com)'
        }
      });
      
      const nearbyCities = nearbyResponse.data.address.city || nearbyResponse.data.address.town;
      return nearbyCities ? [nearbyCities] : [];
    }
    return [];
  } catch (error) {
    console.error('Error fetching nearby cities:', error.message);
    return [];
  }
};

// Updated function to get cities from team addresses including nearby cities
const getTeamCities = async (teamIds) => {
  const teams = await Teams.find({ _id: { $in: teamIds } });
  const cities = [];
  for (const team of teams) {
    const teamCity = await getNearbyCities(team.address);
    cities.push(...teamCity);
  }
  return cities;
};

// CREATE a new class
export const createClass = async (req, res, next) => {
  try {
    // Convert team names to team IDs
    let teamIds = [];
    if (req.body.teams && Array.isArray(req.body.teams)) {
      teamIds = await getTeamIds(req.body.teams);
    }

    // Fetch nearby cities
    const city = req.body.city;
    const nearbyCities = await getNearbyCities(city);

    // Fetch team cities including nearby ones
    const teamCities = await getTeamCities(teamIds);

    // Modify the cities array to ensure spaces between city names
    const cities = Array.from(new Set([city, ...nearbyCities, ...teamCities]))
      .map(c => c.trim())
      .join(', ')
      .split(', ');

    // Create and save a new class instance with linked team IDs
    const newClass = new Class({
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      city: cities,
      type: req.body.type,
      daysrequired: req.body.daysrequired,
      oneLiner: req.body.oneliner,
      supplies: req.body.supplies,
      photos: req.body.photos,
      teams: teamIds
    });

    const savedClass = await newClass.save();
    res.status(201).json(savedClass);
  } catch (err) {
    next(err); // Passes the error to the global error handler
  }
};

// UPDATE a class by ID
export const updateClass = async (req, res, next) => {
  try {
    // Convert team names to team IDs
    let teamIds = [];
    if (req.body.teams && Array.isArray(req.body.teams)) {
      teamIds = await getTeamIds(req.body.teams);
    }

    // Fetch nearby cities
    const city = req.body.city;
    const nearbyCities = await getNearbyCities(city);

    // Fetch team cities
    const teamCities = await getTeamCities(teamIds);

    // Modify the cities array to ensure spaces between city names
    const cities = Array.from(new Set([city, ...nearbyCities.flat(), ...teamCities.flat()]))
      .filter(Boolean)
      .map(c => c.trim())
      .join(', ')
      .split(', ');

    // Update the class with new data and linked team IDs
    const updatedClass = await Class.findByIdAndUpdate(req.params.id, {
      ...req.body,
      city: cities,
      teams: teamIds
    }, { new: true, runValidators: true });

    if (!updatedClass) {
      return next(createError(404, "Class not found"));
    }
    res.status(200).json(updatedClass);
  } catch (err) {
    console.error('Error in updateClass:', err);
    next(err); // Passes the error to the global error handler
  }
};

// DELETE a class by ID
export const deleteClass = async (req, res, next) => {
  try {
    await Class.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Class deleted successfully' });
  } catch (err) {
    next(err); // Passes the error to the global error handler
  }
};

// GET a class by ID
export const getClass = async (req, res, next) => {
  try {
    const foundClass = await Class.findById(req.params.id);
    if (!foundClass) {
      return next(createError(404, "Class not found"));
    }
    res.status(200).json(foundClass);
  } catch (err) {
    next(err); // Passes the error to the global error handler
  }
};

// GET all classes
export const getAllClasses = async (req, res, next) => {
  try {
    const allClasses = await Class.find();
    res.status(200).json(allClasses);
  } catch (err) {
    next(err); // Passes the error to the global error handler
  }
};

// Count classes by city
export const countByCity = async (req, res, next) => {
  try {
    const city = req.query.city;
    const count = await Class.countDocuments({ city: new RegExp(`^${city}$`, 'i') });
    res.status(200).json({ count });
  } catch (err) {
    next(err); // Passes the error to the global error handler
  }
};

// Search classes by city
export const searchByCity = async (req, res, next) => {
  try {
    const city = req.query.city;
    const nearbyCities = await getNearbyCities(city);
    const cities = Array.from(new Set([city, ...nearbyCities]));

    const classes = await Class.find({ city: { $in: cities.map(c => new RegExp(`^${c}$`, 'i')) } });
    res.status(200).json(classes);
  } catch (err) {
    next(err); // Passes the error to the global error handler
  }
};

// Search classes by type
export const searchByType = async (req, res, next) => {
  try {
    const type = req.query.type;
    const classes = await Class.find({ type: new RegExp(`^${type}$`, 'i') });
    res.status(200).json(classes);
  } catch (err) {
    next(err); // Passes the error to the global error handler
  }
};

export default {
  createClass,
  updateClass,
  deleteClass,
  getClass,
  getAllClasses,
  countByCity,
  searchByCity,
  searchByType,
};