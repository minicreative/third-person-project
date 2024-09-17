/** @namespace api/tools/Authentication */
// Authentication.js: authenticates user

// Initialize dependencies
const Token = require('jsonwebtoken');
const Dates = require('./Dates');
const Secretary = require('./Secretary');
const Messages = require('./Messages');
const Database = require('./Database')
const User = require('./../model/User')

const Async = require('async')
const SendGridMail = require('@sendgrid/mail');

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

						// Don't authorize erased users
						if (user.erased) {
							callback(Secretary.authenticationError(Messages.authErrors.userDeleted))
						} 
						
						// Catch mismatched role to trigger re-authentication (if role is provided on token)
						else if (decodedToken.role && user.role !== decodedToken.role) {
							callback(Secretary.authenticationError(Messages.authErrors.userRoleChanged))
						} 
						
						// Successful auth!
						else {
							callback(null, decodedToken)
						}
					} 
					
					// Catch user lookup error
					else {
						callback(Secretary.authenticationError(Messages.authErrors.unauthorized));
					}
				})
			} 
			
			// Catch error with token verification
			else {

				// Catch expired error
				if (err.expiredAt) {
					callback(Secretary.authenticationError(Messages.authErrors.expired));
				} 
				
				// Catch other errors
				else {
					callback(Secretary.authenticationError(Messages.authErrors.unauthorized));
				}
			}
		});
	},

	/**
	 * Creates a forgotten password token and sends an email 
	 * @memberof api/tools/Authentication
	 * @param {object} user User model object
	 * @param {function(err)} callback Callback function
	*/
	sendPasswordEmail(user, callback) {

		// Synchronously perform the following tasks...
		Async.waterfall([

			// Create a password token valid for one hour
			callback => {
				const signedObject = {
					'user': user.guid,
					'resetPasswordToken': true,
					'exp': parseInt(Dates.fromNow(1, 'hour')),
				};
				Token.sign(signedObject, process.env.tpp_secret, function (err, token) {
					callback(err, token);
				});
			},

			// Use SendGrid to send password token in an email
			(token, callback) => {
				SendGridMail.setApiKey(process.env.tpp_sendgrid);
				SendGridMail.send({
					to: user.email,
					from: {
						email: 'no-reply@thirdpersonproject.org',
						name: 'Third Person Project'
					},
					subject: 'Forgot your password?',
					html: Messages.forgotPasswordEmail(token),
				}).then(() => {
					callback()
				}, err => {
					if (err.response) {
						return callback(Secretary.conflictError(`Was unable to send email: ${err.response}`))
					}
					callback(Secretary.conflictError("Was unable to send email. Please try again"))
				});
			},

		], err => callback(err));

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