/** @namespace api/model/Object */

// Initialize dependencies
const Uuid = require('uuid');
const Database = require('../tools/Database.js');
const Dates = require('../tools/Dates.js');

// Object Properties: configures properties for database object
function ObjectProperties (schema) {
    schema.add({

		// GUID: a unique identified for an object
        'guid': {
            'type': String,
            'index': true,
            'unique': true
        },

		// Date Created: the time this object was created
		'dateCreated': {
			'type': Number,
		},

        // Last Modified: the time this object was last modified
        'lastModified': {
            'type': Number,
            'index': true
        },

		// Erased: whether object has been deleted
		'erased': {
			'type': Boolean,
			'index': true,
			'required': true,
		},

		// Date Erased: the time this object was marked as deleted
		'dateErased': {
			'type': Number,
		}

    });
}

function ObjectInstanceMethods (schema) {

	/**
	 * Formats an existing object
	 * @memberof api/model/Object
	 * @param {function(err, object)} callback Callback function
	 */
	schema.methods.format = function (callback) {
		callback(null, this.toObject())
	};

	/**
	 * Deletes an existing object
	 * @memberof api/model/Object
	 * @param {function(err, object)} callback Callback function
	 */
	schema.methods.delete = function (callback) {
		var model = this;
		Database.update({
			'model': model.constructor,
			'query': {
				'guid': this.guid,
			},
			'update': {
				'$set': {
					erased: true,
					dateErased: Dates.now(),
				}
			},
		}, function (err, obj) {
			callback(err, obj);
		});
	}
}

// Object Static Methods: attaches functionality used by the schema in general
function ObjectStaticMethods (schema) {

	/**
	 * Generates a guaranteed unique GUID for a Mongo collection
	 * @memberof api/model/Object
	 * @param {function(err, GUID)} callback Callback function
	 */
	schema.statics.GUID = function (callback) {

		// Save reference to model object
		var model = this;

		// Generate a new GUID
		var GUID = Uuid.v4();

		// Build query to check for uniqueness
		var query = {
			'guid': GUID
		};

		// Check for uniqueness
		Database.findOne({model, query}, function(err, object) {

			// If an object exists, recursively make another GUID.
			if (object) return model.GUID(callback);

			// Otherwise, callback with GUID
			callback(err, GUID);
		});
	};

};

// Export object properties and methods
module.exports = function (schema) {
	ObjectProperties(schema);
	ObjectInstanceMethods(schema);
	ObjectStaticMethods(schema);
}
