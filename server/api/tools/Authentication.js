/** @namespace api/tools/Authentication */
// Authentication.js: authenticates user

// Initialize dependencies
const Token = require('jsonwebtoken');
const Dates = require('./Dates');
const Secretary = require('./Secretary');
const Messages = require('./Messages');
const Database = require('./Database')
const User = require('./../model/User')

// Helper functions
function getTokenFromRequest (request) {
	if (!request.headers) return null;
	return request.headers.authorization;
};

module.exports = {

	/**
	 * Creates a token using a user object
	 * @memberof api/tools/Authentication
	 * @param {object} user User model object
	 * @param {function(err, encodedToken)} callback Callback function
	*/
	makeUserToken(user, callback) {
		const signedObject = {
			'user': user.guid,
			'exp': parseInt(Dates.fromNow(60, 'days')),
			'role': user.role,
		};
		Token.sign(signedObject, process.env.tpp_secret, function (err, token) {
			callback(err, token);
		});
	},

	/**
	 * Produces an authentication error or returns a decoded token for a user
	 * @memberof api/tools/Authentication
	 * @param {object} request Express.js request object
	 * @param {boolean} isRequired Boolean expressing whether authentication is required
	 * @param {function(err, decodedToken)} callback Callback function
	 */
	authenticateUser(request, isRequired, callback) {
		const token = getTokenFromRequest(request);

		// Handle missing token if authentication is required
		if (!token) {
			if (isRequired) return callback(Secretary.authenticationError(Messages.authErrors.missingToken));
			return callback()
		}

		// Authenticate provided token
		const pureToken = token.replace('Bearer ', '');
		Token.verify(pureToken, process.env.tpp_secret, function (err, decodedToken) {
			if (!err && decodedToken) {
				Database.findOne({
					model: User,
					query: { guid: decodedToken.user }
				}, function(err, user) {
					if (!err && user) {
						if (user.erased) {
							callback(Secretary.authenticationError(Messages.authErrors.userDeleted))
						} else if (user.role === decodedToken.role) {
							callback(null, decodedToken)
						} else {
							callback(Secretary.authenticationError(Messages.authErrors.userRoleChanged))
						}
					} else {
						callback(Secretary.authenticationError(Messages.authErrors.unauthorized));
					}
				})
			} else {
				if (err.expiredAt) {
					callback(Secretary.authenticationError(Messages.authErrors.expired));
				} else {
					callback(Secretary.authenticationError(Messages.authErrors.unauthorized));
				}
			}
		});
	},

	/**
	 * Produces an authentication error or returns a decoded token for an administrator
	 * @memberof api/tools/Authentication
	 * @param {object} request Express.js request object
	 * @param {function(err, decodedToken)} callback Callback function
	 */
	authenticateAdministrator(request, callback) {
		this.authenticateUser(request, true, function(err, decodedToken) {
			if (err) return callback(err)
			if (decodedToken.role !== "administrator")
				return callback(Secretary.authorizationError(Messages.authErrors.notAdmin))
			callback(null, decodedToken)
		})
	}
}