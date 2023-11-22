const Async = require('async')

const Database = require('./../tools/Database')
const Validation = require('./../tools/Validation')
const Secretary = require('./../tools/Secretary')
const Messages = require('./../tools/Messages')
const Authentication = require('./../tools/Authentication')

const Annotation = require('./../model/Annotation')
const User = require('../model/User')

module.exports = router => {

	/**
	 * @api {POST} /annotation.get Get
	 * @apiName Get
	 * @apiGroup Annotation
	 * @apiDescription Get an annotation by GUID
	 * 
	 * @apiParam {String} guid Annotation GUID
	 *
	 * @apiSuccess {Object} annotation Annotation object
	 *
	 * @apiUse Error
	 */
	router.post('/annotation.get', (req, res, next) => {
		req.handled = true;

		// Validate query parameters
		var validations = [
			Validation.string('GUID', req.body.guid)
		];
		let err = Validation.catchErrors(validations)
		if (err) return next(err)

		Database.findOne({
			'model': Annotation,
			'query': {
				'guid': req.body.guid
			}
		}, (err, annotation) => {
			if (err) return next(err)
			if (!annotation) return next(Secretary.requestError(Messages.conflictErrors.objectNotFound));
			Secretary.addToResponse(res, "annotation", annotation);
			next()
		})
	})

	/**
	 * @api {POST} /annotation.list List
	 * @apiName List
	 * @apiGroup Annotation
	 * @apiDescription Lists annotations
	 * 
	 * @apiParam {String} [context] Annotation context
	 * @apiParam {String} [user] User GUID
	 *
	 * @apiSuccess {Array} annotations Annotation object array
	 *
	 * @apiUse Error
	 */
	router.post('/annotation.list', (req, res, next) => {
		req.handled = true;

		// Synchronously perform the following tasks...
		Async.waterfall([

			// Validate parameters
			(callback) => {
				var validations = [];
				if (req.body.text) validations.push(Validation.string('Text', req.body.text))
				if (req.body.context) validations.push(Validation.string('Context', req.body.context))
				if (req.body.author) validations.push(Validation.string('Author', req.body.author))
				if (req.body.status) validations.push(Validation.status('Status', req.body.status)) // TODO: Allow for array of statuses
				callback(Validation.catchErrors(validations))
			},

			// Query users by name if author filter present
			(callback) => {
				if (req.body.author) {
					let query = {
						name: Database.text(req.body.author),
					}
					console.log(query)
					Database.find({
						model: User,
						query: query,
					}, (err, users) => {
						console.log(users)
						if (err) return callback(null, [])
						callback(null, users)
					})
				} else callback(null, [])
			},

			// Assemble query & page objects
			(users, callback) => {

				// Setup query
				const query = {}

				// Add text queries
				if (req.body.text) query.text = Database.text(req.body.text)
				if (req.body.context) query.context = Database.text(req.body.context)

				// Add status query
				if (req.body.status) query.status = req.body.status // TODO: Allow for array of statuses

				// Add author query (using $or)
				if (req.body.author) {
					let userGUIDs = []
					for (let user of users) {
						userGUIDs.push(user.guid)
					}
					query["$or"] = [
						{ user: { "$in": userGUIDs } },
						{ attribution: Database.text(req.body.author) },
					]
				}
				
				// Setup page options
				const pageOptions = {
					model: Annotation,
					pageSize: 100,
					query: query,
				};

				// Page query
				Database.page(pageOptions, (err, annotations) => {
					Secretary.addToResponse(res, "annotations", annotations);
					callback(err)
				})
			}

		], err => next(err));

		
	})

	/**
	 * @api {POST} /annotation.create Create
	 * @apiName Create
	 * @apiGroup Annotation
	 * @apiDescription Creates and returns a new annotation
	 *
	 * @apiParam {String} context Annotation context
	 * @apiParam {String} text Annotated text
     * @apiParam {String} body Annotation body
	 * @apiParam {String} [attribution] Attribution
	 * @apiParam {String} [status] Annotation status
	 *
	 * @apiSuccess {Object} annotation Annotation object
	 *
	 * @apiUse Authorization
	 * @apiUse Error
	 */
	router.post('/annotation.create', (req, res, next) => {
		req.handled = true;

		// Synchronously perform the following tasks...
		Async.waterfall([

			// Authenticate user
			callback => {
				Authentication.authenticateUser(req, function (err, token) {
					callback(err, token);
				});
			},

			// Validate parameters
			(token, callback) => {
				var validations = [
                    Validation.string('Text', req.body.text),
                    Validation.string('Body', req.body.body),
                    Validation.string('Context', req.body.context)
                ];
                if (req.body.attribution) validations.push(Validation.string('Attribution', req.body.attribution))
				if (req.body.status) validations.push(Validation.status('Status', req.body.status))
				callback(Validation.catchErrors(validations), token)
			},

			// Authorize based on user token
			(token, callback) => {
				let err
				if (token.role === Messages.ANNOTATOR && req.body.status) {
					err = Secretary.authorizationError(Messages.authErrors.annotatorStatusCreate)
				}
				callback(err, token)
			},

			// Create a new annotation, add to reply
			(token, callback) => {
				let vars = {
					'user': token.user,
					'context': req.body.context,
					'text': req.body.text,
					'body': req.body.body,
					'status': req.body.status ? req.body.status : Messages.DRAFT,
				};
                if (req.body.attribution) vars.attribution = req.body.attribution
				Annotation.create(vars, (err, annotation) => {
					Secretary.addToResponse(res, "annotation", annotation)
					callback(err);
				});
			}

		], err => next(err));
	})

	/**
	 * @api {POST} /annotation.edit Edit
	 * @apiName Edit
	 * @apiGroup Annotation
	 * @apiDescription Edits and returns an existing annotation
	 *
     * @apiParam {String} guid Annotation GUID
	 * @apiParam {String} [context] Annotation context
	 * @apiParam {String} [text] Annotated text
     * @apiParam {String} [body] Annotation body
	 *
	 * @apiSuccess {Object} annotation Annotation object
	 *
	 * @apiUse Authorization
	 * @apiUse Error
	 */
	router.post('/annotation.edit', (req, res, next) => {
		req.handled = true;

		// Synchronously perform the following tasks...
		Async.waterfall([

			// Authenticate user
			callback => {
				Authentication.authenticateUser(req, function (err, token) {
					callback(err, token);
				});
			},

			// Validate parameters
			(token, callback) => {
				var validations = [
					Validation.string('GUID', req.body.guid)
				];
				if (req.body.context) validations.push(Validation.string('Context', req.body.context))
				if (req.body.text) validations.push(Validation.string('Text', req.body.text))
				if (req.body.body) validations.push(Validation.string('Body', req.body.body))
                if (req.body.attribution) validations.push(Validation.string('Attribution', req.body.attribution))
				if (req.body.status) validations.push(Validation.status('Status', req.body.status))
				callback(Validation.catchErrors(validations), token)
			},

			// Find annotation to edit
			(token, callback) => {
				Database.findOne({
					'model': Annotation,
					'query': {
						'guid': req.body.guid
					}
				}, (err, annotation) => {
					if (!annotation) callback(Secretary.requestError(Messages.conflictErrors.objectNotFound));
					else callback(err, token, annotation)
				})
			},

			// Authorize based on user token
			(token, annotation, callback) => {
				let err
				if (token.role === Messages.ANNOTATOR) {
					if (token.user !== annotation.user)
						err = Secretary.authorizationError(Messages.authErrors.annotatorEdit)
					if (req.body.status) 
						err = Secretary.authorizationError(Messages.authErrors.annotatorStatusEdit)
				}
				callback(err, token, annotation)
			},

			// Edit annotation, add to reply
			(token, annotation, callback) => {
                let vars = {}
                if (req.body.context) vars.context = req.body.context
                if (req.body.text) vars.text = req.body.text
                if (req.body.body) vars.body = req.body.body
                if (req.body.attribution === "" || req.body.attribution) vars.attribution = req.body.attribution;
				if (token.role === Messages.ANNOTATOR) {
					vars.status = Messages.EDITED
				} else if (req.body.status) {
					vars.status = req.body.status
				}
				annotation.edit(vars, (err, annotation) => {
					Secretary.addToResponse(res, "annotation", annotation)
					callback(err);
				});
			}
			
		], err => next(err));
	})

	/**
	 * @api {POST} /annotation.delete Delete
	 * @apiName Delete
	 * @apiGroup Annotation
	 * @apiDescription Deletes an existing annotation
	 *
     * @apiParam {String} guid Annotation GUID
	 *
	 * @apiUse Authorization
	 * @apiUse Error
	 */
	router.post('/annotation.delete', (req, res, next) => {
		req.handled = true;

		// Synchronously perform the following tasks...
		Async.waterfall([

			// Authenticate user
			callback => {
				Authentication.authenticateUser(req, function (err, token) {
					callback(err, token);
				});
			},

			// Validate parameters
			(token, callback) => {
				var validations = [
					Validation.string('GUID', req.body.guid)
				];
				callback(Validation.catchErrors(validations), token)
			},

			// Find annotation to delete
			(token, callback) => {
				Database.findOne({
					'model': Annotation,
					'query': {
						'guid': req.body.guid
					}
				}, (err, annotation) => {
					if (!annotation) callback(Secretary.requestError(Messages.conflictErrors.objectNotFound));
					else callback(err, token, annotation)
				})
			},

			// Authorize based on user token
			(token, annotation, callback) => {
				let err
				if (token.role === Messages.ANNOTATOR) {
					if (token.user !== annotation.user)
						err = Secretary.authorizationError(Messages.authErrors.annotatorDelete)
				}
				callback(err, annotation)
			},

			// Delete annotation
			(annotation, callback) => {
				annotation.delete((err) => {
					Secretary.successResponse(res, "Annotation deleted")
					callback(err);
				});
			}
			
		], err => next(err));
	})

}
