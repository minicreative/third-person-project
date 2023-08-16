/** @namespace api/tools/Dates */
// Dates.js: provides tools for generating / handling dates

// Initialize dependencies
const Moment = require('moment');

module.exports = {

	/**
	 * Gets the current time
	 * @memberof api/tools/Dates
	 * @return {Number} UNIX Timestamp of current moment
	 */
	now: function () {
		return Moment().format('X');
	},

	/**
	 * Gets an exact time in the future based on current time
	 * @memberof api/tools/Dates
	 * @param {Number} num Number of time units to add to current time
	 * @param {String} string Time units identifier
	 * @return {Number} UNIX Timestamp
	 */
	fromNow: function (num, string) {
		return Moment().add(num, string).format('X');
	},
};