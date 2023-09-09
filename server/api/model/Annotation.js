/** @namespace api/model/Context */

// Initialize dependencies
const Mongoose = require('mongoose');
const Async = require('async');
const Database = require('./../tools/Database');
const Dates = require('./../tools/Dates');
const User = require('./User')

// Annotation Properties: configures properties for database object
function AnnotationProperties (schema) {
    schema.add({
        'context': {
			'type': String,
			'index': true,
			'required': true
		},
		'text': {
			'type': String,
			'index': true,
			'required': true
		},
        'body': {
			'type': String,
			'index': false,
			'required': true
		},
        'user': {
            'type': String,
            'index': true,
            'required': true
        },
        'attribution': {
            'type': String,
            'index': false,
            'required': false,
        }
    });
};

// Annotation Static Methods: attaches functionality used by the schema in general
function AnnotationStaticMethods (schema) {

	/**
	 * Creates a new annotation in the database
	 * @memberof api/model/Annotation
	 * @param {Object} params
     * @param {String} params.user User GUID
	 * @param {String} params.context Context of annotation
	 * @param {String} params.text Annotated text
	 * @param {String} params.body Annotation body
     * @param {String} params.attribution Attribution
	 * @param {function(err, annotation)} callback Callback function
	 */
	schema.statics.create = function ({
        user, context, text, body, attribution
    }, callback) {

		// Save reference to model
		var Annotation = this;

		// Synchronously perform the following tasks, then make callback...
		Async.waterfall([

			// Generate a unique GUID
			function (callback) {
				Annotation.GUID(function (err, GUID) {
					callback(err, GUID);
				})
			},

			// Write new annotation to the database
			function (GUID, callback) {

				// Setup query with GUID
				var query = {
					'guid': GUID
				};

				// Setup database update
                let set = {
                    'guid': GUID,
                    'context': context,
                    'text': text,
                    'body': body,
                    'user': user,
                    'dateCreated': Dates.now(),
                }
                if (attribution) set.attribution = attribution
				var update = {
					'$set': set
				};

				// Make database update
				Database.update({
					'model': Annotation,
					'query': query,
					'update': update,
				}, function (err, annotation) {
					callback(err, annotation);
				});
			},

		], function (err, annotation) {
			callback(err, annotation);
		});
	};
};

// Annotation Instance Methods: attaches functionality related to existing instances of the object
function AnnotationInstanceMethods (schema) {

	/**
	 * Updates an existing annotation
	 * @memberof api/model/Annotation
	 * @param {Object} params
	 * @param {String} [params.context] Context of annotation
     * @param {String} [params.text] Annotated text
     * @param {String} [params.body] Annotation body
     * @param {String} [params.attribution] Attribution
	 * @param {function(err, annotation)} callback Callback function
	 */
	schema.methods.edit = function ({
		context, text, body, attribution
	}, callback) {

		// Save reference to model
		var Annotation = this;

		// Setup query with GUID
		var query = {
			'guid': this.guid,
		};

		// Setup database update
		var set = {
			'lastModified': Dates.now(),
		};
		if (context) set.context = context;
        if (text) set.text = text;
        if (body) set.body = body;
        if (attribution) set.attribution = attribution;
		var update = {
			'$set': set
		};

		// Make database update
		Database.update({
			'model': Annotation.constructor,
			'query': query,
			'update': update,
		}, function (err, annotation) {
			callback(err, annotation);
		});
	};

    /**
	 * Deletes an existing Annotaton
	 * @memberof api/model/Annotaton
	 * @param {function(err, annotation)} callback Callback function
	 */
	schema.methods.delete = function (callback) {

		// Save reference to model
		var Annotation = this;

		Annotation.deleteOne({
			'guid': this.guid,
		}, function (err, annotation) {
			callback(err, annotation);
		});
	};

	/**
	 * Formats an existing annotation for the client
	 * @memberof api/model/Annotation
	 * @param {function(err, annotation)} callback Callback function
	 */
	schema.methods.format = function (callback) {

		// Initialize formatted object
		var thisObject = this.toObject();

		Async.waterfall([

			// Attach user metadata
			function (callback) {
				Database.findOne({
					'model': User,
					'query': {
						'guid': thisObject.user,
					}
				}, function (err, user) {
					if (user) {
						thisObject.userName = user.name;
					}
					callback();
				});
			},

		], function (err) {
			callback(err, thisObject);
		})
	};

};

// Make schema for new annotation object...
const annotationSchema = new Mongoose.Schema;

// Inherit Object properties and methods
require('./Object')(annotationSchema);

// Add annotation properties and methods to schema
AnnotationProperties(annotationSchema);
AnnotationStaticMethods(annotationSchema);
AnnotationInstanceMethods(annotationSchema);

// Return new model object
module.exports = Mongoose.model('Annotation', annotationSchema)