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
				if (req.body.role) validations.push(Validation.role('Role', req.body.role)) // TODO: Allow for array of roles

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
				if (req.body.role) query.role = req.body.role

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
				Authentication.authenticateUser(req, function (err, token) {
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
					if (!user) return callback(Secretary.conflictError(Messages.authErrors.invalidToken));
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
						if (!user) return callback(Secretary.conflictError(Messages.conflictErrors.objectNotFound));
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
		if (req.body.name) {
			validations.push(Validation.string('Name', req.body.name))
		}
		var err = Validation.catchErrors(validations);
		if (err) return next(err);

		// Synchronously perform the following tasks...
		Async.waterfall([

			// Authenticate user
			callback => {
				Authentication.authenticateUser(req, function (err, token) {
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

			// Edit user, add to reply
			(user, callback) => {
				user.edit({
					'name': req.body.name,
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
					if (!user) callback(Secretary.requestError(Messages.conflictErrors.objectNotFound));
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
					if (!user) callback(Secretary.conflictError(Messages.conflictErrors.emailNotFound));
					else callback(err, user);
				});
			},

			// Check password, add to request if correct
			(user, callback) => {
				if (HashPassword.verify(req.body.password, user.password)) {
					callback(null, user);
					Secretary.addToResponse(res, "user", user);
				} else {
					callback(Secretary.conflictError(Messages.conflictErrors.passwordIncorrect));
				}
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

}
