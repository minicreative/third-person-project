/** @namespace api/tools/Secretary */

const Async = require('async')
const Messages = require('./Messages')

const privateKeys = [
	"_id",
	"__v",
	"password",
	"events"
];

function createError(code, message) {
	return {
		'code': code,
		'message': message,
		'handledError': true,
	};
};

function removePrivateKeys(object) {
	for (var i in privateKeys) delete object[privateKeys[i]];
	return object;
}

module.exports = {

	/**
	 * Creates an error config object for a request error
	 * @memberof api/tools/Secretary
	 * @param {String} message
	 * @return {Object} Error object {code, message, handledError: true}
	 */
	requestError: message => {
		return createError(Messages.codes.requestError, message);
	},

	/**
	 * Creates an error config object for a not found error
	 * @memberof api/tools/Secretary
	 * @param {String} message
	 * @return {Object} Error object {code, message, handledError: true}
	 */
	notFoundError: message => {
		return createError(Messages.codes.notFoundError, message);
	},

	/**
	 * Creates an error config object for a conflict error
	 * @memberof api/tools/Secretary
	 * @param {String} message
	 * @return {Object} Error object {code, message, handledError: true}
	 */
	conflictError: message => {
		return createError(Messages.codes.conflictError, message);
	},

	/**
	 * Creates an error config object for a authentication error
	 * @memberof api/tools/Secretary
	 * @param {String} message
	 * @return {Object} Error object {code, message, handledError: true}
	 */
	authenticationError: message => {
		return createError(Messages.codes.unauthenticatedError, message);
	},

	/**
	 * Creates an error config object for a authorization error
	 * @memberof api/tools/Secretary
	 * @param {String} message
	 * @return {Object} Error object {code, message, handledError: true}
	 */
	authorizationError: message => {
		return createError(Messages.codes.unauthorizedError, message);
	},

	/**
	 * Creates an error config object for an internal server error
	 * @memberof api/tools/Secretary
	 * @param {String} message
	 * @return {Object} Error object {code, message, handledError: true}
	 */
	serverError: message => {
		if (message) return createError(Messages.codes.serverError, message);
		return createError(Messages.codes.serverError, Messages.serverError);
	},

	/**
	 * Attaches JSON to a provided response
	 * @memberof api/tools/Secretary
	 * @param {Object} response Express response object
	 * @param {String} key JSON key to attach
	 * @param {Object} value JSON object to attach
	 * @param {Boolean} noFormat True if object should not be formatted
	 */
	addToResponse: (response, key, value, noFormat) => {
		if (noFormat) {
			if (!response.body) response.body = {};
			response.body[key] = value;
		} else {
			if (!response.toFormat) response.toFormat = {};
			response.toFormat[key] = value;
		}
	},

	/**
	 * Creates a basic success response with a message
	 * @memberof api/tools/Secretary
	 * @param {Object} response Express response object
	 * @param {String} message Message
	 */
	successResponse: (response, message) => { 
		response.body = {
			message: message,
		}
	},

	/**
	 * Prepares responses for client
	 * @memberof api/tools/Secretary
	 * @param {Object} response Express response object
	 * @param {function (err, object)} callback Callback function
	 */
	prepareResponse(response, callback) {

		// Return if no objectsToFormat
		if (!response.toFormat) {
			callback();
			return;
		}
	
		// Initialize response body
		if (!response.body) response.body = {};
	
		// Format all objects in objectsToFormat
		Async.eachOf(response.toFormat, (object, key, callback) => {
			if (object instanceof Array) {
				var formattedObjects = new Array(object.length);
				Async.eachOf(object, (arrayObject, index, callback) => {
					arrayObject.format((err, formattedObject) => {
						if (formattedObject) formattedObjects[index] = removePrivateKeys(formattedObject);
						callback(err);
					});
				}, err => {
					response.body[key] = formattedObjects;
					callback(err);
				})
			} else {
				object.format((err, formattedObject) => {
					if (formattedObject) response.body[key] = removePrivateKeys(formattedObject);
					callback(err);
				});
			}
		}, function (err) {
			callback(err);
		});
	},
};
