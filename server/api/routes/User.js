const Async = require('async')
const HashPassword = require('password-hash')

const Database = require('./../tools/Database')
const Validation = require('./../tools/Validation')
const Secretary = require('./../tools/Secretary')
const Messages = require('./../tools/Messages')
const Authentication = require('./../tools/Authentication')
const Dates = require('./../tools/Dates')

const User = require('./../model/User')

module.exports = router => {

	/**
	 * @api {POST} /user.getRoleOptions Get Role Options
	 * @apiName Get Role Options
	 * @apiGroup User
	 * @apiDescription Get an ordered array of role options
	 *
	 * @apiSuccess {Array} roles Array of role options
	 *
	 * @apiUse Error
	 */
	router.post('/user.getRoleOptions', (req, res, next) => {
		req.handled = true;
		res.body = {
			options: Messages.roles
		}
		next()
	})

	/**
	 * @api {POST} /user.list List
	 * @apiName List
	 * @apiGroup User
	 * @apiDescription Lists users
	 * 
	 * @apiParam {String} name String to filter by name
	 * @apiParam {String} email String to filter by email
	 * @apiParam {String} role Valid string to filter by role
	 *
	 * @apiSuccess {Array} users User object array
	 *
	 * @apiUse Error
	 */
	router.post('/user.list', (req, res, next) => {
		req.handled = true;

		// Synchronously perform the following tasks...
		Async.waterfall([

			// Authenticate user
			callback => {
				Authentication.authenticateAdministrator(req, function (err) {
					callback(err);
				});
			},

			// Validate parameters
			(callback) => {
				var validations = [];

				// Pagination parameters
				if (req.body.pageSize) validations.push(Validation.pageSize('Page size', req.body.pageSize))
				if (req.body.skip) validations.push(Validation.number('Skip', req.body.skip))
				if (req.body.sort) validations.push(Validation.string('Sort', req.body.sort))

				// Filter parameters
				if (req.body.name) validations.push(Validation.string('Name', req.body.name))
				if (req.body.email) validations.push(Validation.string('Email', req.body.email))
				if (req.body.role) validations.push(Validation.roleArray('Role', req.body.role)) 

				callback(Validation.catchErrors(validations))
			},

			// Setup query and page database
			callback => {

				// Setup query
				const query = {
					erased: false,
				}

				if (req.body.name) query.name = Database.text(req.body.name)
				if (req.body.email) query.email = Database.text(req.body.email)
				if (req.body.role && req.body.role.length > 0) 
					query.role = {'$in': req.body.role}

				const pageOptions = {
					model: User,
					pageSize: req.body.pageSize ? req.body.pageSize : 20,
					skip: req.body.skip,
					sort: req.body.sort,
					query: query,
				};

				// Page query
				Database.page(pageOptions, (err, users) => {
					if (err) return callback(err)
					Secretary.addToResponse(res, "users", users);
					callback()
				})
			}

		], err => next(err));
	})

	/**
	 * @api {POST} /user.get Get
	 * @apiName Get
	 * @apiGroup User
	 * @apiDescription Get a user using authentication token
	 *
	 * @apiParam {String} token User's token
	 *
	 * @apiSuccess {Object} user User object
	 *
	 * @apiUse Error
	 */
	router.post('/user.get', (req, res, next) => {
		req.handled = true;

		// Synchronously perform the following tasks...
		Async.waterfall([

			// Authenticate user
			callback => {
				Authentication.authenticateUser(req, true, function (err, token) {
					callback(err, token);
				});
			},

			// Find and return user from token
			(token, callback) => {
				Database.findOne({
					'model': User,
					'query': {
						'guid': token.user,
					},
				}, (err, user) => {
					if (!user) return callback(Secretary.requestError(Messages.authErrors.invalidToken));
					Secretary.addToResponse(res, 'user', user);
					callback();
				});
			}

		], err => next(err));
	})

	/**
	 * @api {POST} /user.getGUID Get by GUID
	 * @apiName Get by GUID
	 * @apiGroup User
	 * @apiDescription Get a user using a GUID
	 *
	 * @apiParam {String} guid User's GUID
	 *
	 * @apiSuccess {Object} user User object
	 *
	 * @apiUse Error
	 */
	router.post('/user.getGUID', (req, res, next) => {
		req.handled = true;

		// Synchronously perform the following tasks...
		Async.waterfall([

			// Authenticate user
			callback => {
				Authentication.authenticateAdministrator(req, function (err) {
					callback(err);
				});
			},

			// Validate parameters
			callback => {
				var validations = [
					Validation.string('GUID', req.body.guid)
				];
				callback(Validation.catchErrors(validations))
			},

			// Find and return user from token
			callback => {
				Database.findOne({
					'model': User,
					'query': {
						'guid': req.body.guid,
					},
				}, (err, user) => {
					if (err) return callback(err)
					if (!user) return callback(Secretary.requestError(Messages.notFoundErrors.objectNotFound));
					Secretary.addToResponse(res, 'user', user);
					callback()
				});
			}

		], err => next(err));
	})

	/**
	 * @api {POST} /user.create Create
	 * @apiName Create
	 * @apiGroup User
	 * @apiDescription Creates a new user, returns authentication and new user
	 *
	 * @apiParam {String} name User's name
	 * @apiParam {String} email User's email address
	 * @apiParam {String} password User's password (min. 8 characters, numbers and letter required)
	 *
	 * @apiSuccess {Object} user User object
	 * @apiSuccess {String} token Authentication token
	 *
	 * @apiUse Error
	 */
	router.post('/user.create', (req, res, next) => {
		req.handled = true;

		// Validate all fields
		var validations = [
			Validation.email('Email', req.body.email),
			Validation.password('Password', req.body.password),
			Validation.string('Name', req.body.name)
		];
		var err = Validation.catchErrors(validations);
		if (err) return next(err);

		// Hash password
		var password = HashPassword.generate(req.body.password);

		// Synchronously perform the following tasks...
		Async.waterfall([

			// Check if email is unique
			callback => {
				Database.findOne({
					'model': User,
					'query': {
						'email': req.body.email,
					},
				}, (err, user) => {
					if (user) callback(Secretary.conflictError(Messages.conflictErrors.emailAlreadyUsed));
					else callback(err);
				});
			},

			// Create a new user, add to reply
			callback => {
				User.create({
					'name': req.body.name,
					'email': req.body.email,
					'password': password,
					'role': "annotator",
				}, (err, user) => {
					if (user) Secretary.addToResponse(res, "user", user)
					callback(err, user);
				});
			},

			// Create an authentication token for user, add to reply
			(user, callback) => {
				Authentication.makeUserToken(user, (err, token) => {
					if (token) Secretary.addToResponse(res, "token", token, true)
					callback(err);
				});
			},

		], err => next(err));
	})

	/**
	 * @api {POST} /user.edit Edit
	 * @apiName Edit
	 * @apiGroup User
	 * @apiDescription Edits a user based on auth token
	 *
	 * @apiParam {Name} name User's name
	 * 
	 * @apiSuccess {Object} user User object
	 * @apiSuccess {String} token Authentication token
	 *
	 * @apiUse Error
	 */
	router.post('/user.edit', (req, res, next) => {
		req.handled = true;

		// Validate all fields
		let validations = [];
		if (req.body.name) validations.push(Validation.string('Name', req.body.name))
		if (req.body.email) validations.push(Validation.email('Email', req.body.email))
		var err = Validation.catchErrors(validations);
		if (err) return next(err);

		// Setup placeholders for edit function
		let newName, newEmail;

		// Synchronously perform the following tasks...
		Async.waterfall([

			// Authenticate user
			callback => {
				Authentication.authenticateUser(req, true, function (err, token) {
					callback(err, token);
				});
			},

			// Get user for token
			(token, callback) => {
				Database.findOne({
					'model': User,
					'query': {
						'guid': token.user
					}
				}, (err, user) => {
					if (!user) callback(Secretary.requestError(Messages.authErrors.invalidToken));
					else callback(err, user)
				})
			},

			// Check if provided values are new
			(user, callback) => {
				if (req.body.name && req.body.name !== user.name) {
					newName = req.body.name
				}
				if (req.body.email && req.body.email !== user.email) {
					newEmail = req.body.email
				}
				callback(null, user)
			},

			// Validate new email is unique if provided
			(user, callback) => {
				if (newEmail) {
					Database.findOne({
						'model': User,
						'query': {
							'email': newEmail,
						}
					}, (err, matchUser) => {
						if (err) return callback(err)
						if (matchUser) return callback(Secretary.conflictError(Messages.conflictErrors.emailAlreadyUsed));
						callback(null, user)
					})
				} else {
					callback(null, user)
				}
			},

			// Edit user, add to reply
			(user, callback) => {
				user.edit({
					'name': newName,
					'email': newEmail,
				}, (err, user) => {
					if (user) Secretary.addToResponse(res, "user", user)
					callback(err, user);
				});
			},

		], err => next(err));
	})

	/**
	 * @api {POST} /user.editGUID Edit by GUID
	 * @apiName Edit by GUID
	 * @apiGroup User
	 * @apiDescription Edits a user based on provided GUID
	 *
	 * @apiParam {String} guid User's GUID
	 * @apiParam {String} role User's role
	 * 
	 * @apiSuccess {Object} user User object
	 *
	 * @apiUse Error
	 */
	router.post('/user.editGUID', (req, res, next) => {
		req.handled = true;

		// Validate all fields
		let validations = [
			Validation.string('GUID', req.body.guid),
			Validation.string('Role', req.body.role)
		];
		var err = Validation.catchErrors(validations);
		if (err) return next(err);

		// Synchronously perform the following tasks...
		Async.waterfall([

			// Authenticate user
			callback => {
				Authentication.authenticateAdministrator(req, function (err, token) {
					callback(err, token);
				});
			},

			// Get user for GUID
			(token, callback) => {
				Database.findOne({
					'model': User,
					'query': {
						'guid': req.body.guid
					}
				}, (err, user) => {
					if (!user) callback(Secretary.requestError(Messages.notFoundErrors.objectNotFound));
					else callback(err, token, user)
				})
			},

			// Edit user, add to reply
			(token, user, callback) => {
				user.edit({
					'editingUser': token.user,
					'role': req.body.role,
				}, (err, user) => {
					if (user) Secretary.addToResponse(res, "user", user)
					callback(err, user);
				});
			},

		], err => next(err));
	})

	/**
	 * @api {POST} /user.delete Delete
	 * @apiName Delete
	 * @apiGroup User
	 * @apiDescription Deletes a user based on provided GUID
	 *
	 * @apiParam {String} guid User's GUID
	 * 
	 * @apiSuccess {Object} user User object
	 *
	 * @apiUse Error
	 */
	router.post('/user.delete', (req, res, next) => {
		req.handled = true;

		// Validate all fields
		let validations = [
			Validation.string('GUID', req.body.guid),
		];
		var err = Validation.catchErrors(validations);
		if (err) return next(err);

		// Synchronously perform the following tasks...
		Async.waterfall([

			// Authenticate user
			callback => {
				Authentication.authenticateAdministrator(req, function (err, token) {
					callback(err, token);
				});
			},

			// Get user for GUID
			(token, callback) => {
				Database.findOne({
					'model': User,
					'query': {
						'guid': req.body.guid
					}
				}, (err, user) => {
					if (!user) callback(Secretary.requestError(Messages.notFoundErrors.objectNotFound));
					else callback(err, token, user)
				})
			},

			// Update user with delete event
			(token, user, callback) => {
				user.log({
					event: Messages.EVENT_USER_DELETE,
					actingUser: token.user,
				}, (err, user) => {
					callback(err, user)
				})
			},

			// Delete user
			(user, callback) => {
				user.delete((err, user) => {
					Secretary.addToResponse(res, "user", user)
					callback(err, user)
				})
			},

		], err => next(err));
	})

	/**
	 * @api {POST} /user.login Login
	 * @apiName Login
	 * @apiGroup User
	 * @apiDescription Return authentication and user
	 *
	 * @apiParam {String} email User's email address
	 * @apiParam {String} password User's password (min. 8 characters, numbers and letter required)
	 *
	 * @apiSuccess {Object} user User object
	 * @apiSuccess {String} token Authentication token
	 *
	 * @apiUse Error
	 */
	router.post('/user.login', (req, res, next) => {
		req.handled = true;

		// Validate all fields
		var validations = [
			Validation.email('Email', req.body.email),
			Validation.password('Password', req.body.password)
		];
		var err = Validation.catchErrors(validations);
		if (err) return next(err);

		// Hash password
		var password = HashPassword.generate(req.body.password);

		// Synchronously perform the following tasks...
		Async.waterfall([

			// Find user with email
			callback => {
				Database.findOne({
					'model': User,
					'query': {
						'email': req.body.email,
					},
				}, (err, user) => {

					// Handle error
					if (err) return callback(err)

					// Handle user not found
					if (!user) {
						return callback(Secretary.notFoundError(Messages.notFoundErrors.emailNotFound));
					}

					// Verify password
					if (!HashPassword.verify(req.body.password, user.password)) {
						return callback(Secretary.requestError(Messages.requestErrors.passwordIncorrect));
					} 

					// Handle user erased
					if (user.erased) {
						return callback(Secretary.authorizationError(Messages.authErrors.userDeleted));
					}

					Secretary.addToResponse(res, "user", user);
					return callback(null, user);
				});
			},

			// Create an authentication token for user, add to reply
			(user, callback) => {
				Authentication.makeUserToken(user, (err, token) => {
					if (token) Secretary.addToResponse(res, "token", token, true)
					callback(err);
				});
			},

		], err => next(err));
	})

	/**
	 * @api {POST} /user.forgotPassword Forgot Password
	 * @apiName Forgot Password
	 * @apiGroup User
	 *
	 * @apiParam {String} email User's email address
	 *
	 * @apiUse Error
	 */
	router.post('/user.forgotPassword', (req, res, next) => {
		req.handled = true;

		// Validate all fields
		var validations = [
			Validation.email('Email', req.body.email),
		];
		var err = Validation.catchErrors(validations);
		if (err) return next(err);

		// Synchronously perform the following tasks...
		Async.waterfall([

			// Find user with email
			callback => {
				Database.findOne({
					'model': User,
					'query': {
						'email': req.body.email,
					},
				}, (err, user) => {
					if (!user) err = Secretary.notFoundError(Messages.notFoundErrors.emailNotFound)
					callback(err, user)
				});
			},

			// Log event
			(user, callback) => {
				user.log({
					event: Messages.EVENT_USER_PASSWORD_FORGOT,
				}, (err, user) => {
					callback(err, user)
				})
			},

			// Send a forgot password email
			(user, callback) => {
				Authentication.sendPasswordEmail(user, (err) => {
					Secretary.successResponse(res, Messages.successMessages.passwordResetLink)
					callback(err)
				});
			},

		], err => next(err));
	})

	/**
	 * @api {POST} /user.changePassword Change Password
	 * @apiName Change Password
	 * @apiGroup User
	 *
	 * @apiParam {String} password New password
	 * @apiParam {String} [passwordCurrent] Current password
	 *
	 * @apiUse Error
	 */
	router.post('/user.changePassword', (req, res, next) => {
		req.handled = true;

		// Synchronously perform the following tasks...
		Async.waterfall([

			// Authenticate user (get token)
			callback => {
				Authentication.authenticateUser(req, true, function (err, token) {
					callback(err, token);
				});
			},

			// Validate parameters using token
			(token, callback) => {
				console.log(token)
				var validations = [
					Validation.password('Password', req.body.password),
				];
				if (!token.resetPasswordToken) {
					validations.push(Validation.password('Current password', req.body.passwordCurrent))
				}
				callback(Validation.catchErrors(validations), token)
			},

			// Find user with token
			(token, callback) => {
				Database.findOne({
					'model': User,
					'query': {
						'guid': token.user,
					},
				}, (err, user) => {
					if (!user) err = Secretary.notFoundError(Messages.notFoundErrors.objectNotFound)
					callback(err, token, user)
				});
			},

			// Validate current password if not password reset token
			(token, user, callback) => {
				if (!token.resetPasswordToken && !HashPassword.verify(req.body.passwordCurrent, user.password)) {
					return callback(Secretary.requestError(Messages.requestErrors.passwordCurrentIncorrect));
				}
				return callback(null, user)
			},

			// Update user
			(user, callback) => {
				user.edit({
					password: HashPassword.generate(req.body.password),
				}, (err, user) => {
					Secretary.addToResponse(res, "user", user)
					callback(err);
				});
			},

		], err => next(err));
	})

}
