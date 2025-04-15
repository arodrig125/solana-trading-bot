// telegramAuth.js - Utility for checking Telegram user roles/permissions
const User = require('../models/User');

/**
 * Fetch the user from DB by Telegram user ID (assumed mapped to username or custom field).
 * @param {object} telegramUser - Telegram user object from msg.from
 * @returns {Promise<User|null>} - User document or null
 */
async function getUserByTelegram(telegramUser) {
  // Assumes Telegram username matches API username (customize if you store mapping differently)
  if (!telegramUser || !telegramUser.username) return null;
  return User.findOne({ username: telegramUser.username });
}

/**
 * Check if Telegram user is admin
 * @param {object} telegramUser - Telegram user object from msg.from
 * @returns {Promise<boolean>} - True if admin
 */
async function isAdmin(telegramUser) {
  const user = await getUserByTelegram(telegramUser);
  return user && user.role === 'admin';
}

/**
 * Check if Telegram user has a specific permission
 * @param {object} telegramUser - Telegram user object from msg.from
 * @param {string} permission - Permission string
 * @returns {Promise<boolean>} - True if user has permission
 */
async function hasPermission(telegramUser, permission) {
  const user = await getUserByTelegram(telegramUser);
  return user && user.permissions && user.permissions.includes(permission);
}

module.exports = {
  getUserByTelegram,
  isAdmin,
  hasPermission
};
