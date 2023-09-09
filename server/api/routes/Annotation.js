const Async = require('async')

const Database = require('./../tools/Database')
const Validation = require('./../tools/Validation')
const Secretary = require('./../tools/Secretary')
const Messages = require('./../tools/Messages')
const Authentication = require('./../tools/Authentication')

const Annotation = require('./../model/Annotation')

module.exports = router => {

	/**
	 * @api {POST} /annotation.create Create
	 * @apiName Create
	 * @apiGroup Annotation
	 * @apiDescription Creates and returns a new annotation
	 *
	 * @apiParam {String} context Annotation context
	 * @apiParam {String} text Annotated text
     * @apiParam {String} body Annotation body
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
				callback(Validation.catchErrors(validations), token)
			},

			// Create a new annotation, add to reply
			(token, callback) => {
				let vars = {
					'user': token.user,
					'context': req.body.context,
					'text': req.body.text,
					'body': req.body.body,
				};
                if (req.body.attribution) vars.attribution = req.body.attribution
				Annotation.create(vars, (err, annotation) => {
                    console.log(annotation)
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
				callback(Validation.catchErrors(validations), token)
			},

			// Find annotation to edit
            // TODO: Validate that user can edit this annotation (either owns or admin)
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

			// Edit annotation, add to reply
			(annotation, callback) => {
                let vars = {}
                if (req.body.context) vars.context = req.body.context
                if (req.body.text) vars.text = req.body.text
                if (req.body.body) vars.body = req.body.body
                if (req.body.attribution) vars.attribution = req.body.attribution;
				annotation.edit(vars, (err, annotation) => {
					Secretary.addToResponse(res, "annotation", annotation)
					callback(err);
				});
			}
			
		], err => next(err));
	})

}
