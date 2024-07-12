import Config from '../models/Config';

const getConfigValue = async (key, defaultValue) => {
  const config = await Config.findOne({ key });
  return config ? config.value : defaultValue;
};

module.exports = getConfigValue;
