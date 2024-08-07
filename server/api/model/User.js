/** @namespace api/model/User */

// Initialize dependencies
const Mongoose = require('mongoose');
const Async = require('async');
const Database = require('./../tools/Database');
const Dates = require('./../tools/Dates');
const Moment = require('moment');
const Messages = require('../tools/Messages');

// User Properties: configures properties for database object
function UserProperties (schema) {
    schema.add({
		'email': {
			'type': String,
			'unique': true,
			'index': true,
			'lowercase': true,
			'required': true,
		},
		'password': {
			'type': String,
			'required': true
		},
		'name': {
			'type': String,
			'index': true,
			'required': true
		},
		'role': {
			'type': String,
			'enum': Messages.roles,
			'index': true,
			'required': true,
		},
		'events': [{
			'date': {
				'type': Number,
				'required': true,
			},
			'user': {
				'type': String,
				'required': true,
			},
			'role': {
				'type': String,
				'required': true,
			}
		}],
    });
};

// User Static Methods: attaches functionality used by the schema in general
function UserStaticMethods (schema) {

	/**
	 * Creates a new user in the database
	 * @memberof api/model/User
	 * @param {Object} params
	 * @param {String} params.name Name of user
	 * @param {String} params.email User email
	 * @param {String} params.password Hashed password for user
	 * @param {String} params.role Role for user
	 * @param {function(err, update)} callback Callback function
	 */
	schema.statics.create = function ({name, email, password, role}, callback) {

		// Save reference to model
		var User = this;

		// Synchronously perform the following tasks, then make callback...
		Async.waterfall([

			// Generate a unique GUID
			function (callback) {
				User.GUID(function (err, GUID) {
					callback(err, GUID);
				})
			},

			// Write new user to the database
			function (GUID, callback) {

				// Make database update
				Database.update({
					'model': User,
					'query': {
						'guid': GUID
					},
					'update': {
						'$set': {
							'guid': GUID,
							'name': name,
							'email': email,
							'password': password,
							'role': role,
							'dateCreated': Dates.now(),
							'erased': false,
						}
					},
				}, function (err, user) {
					callback(err, user);
				});
			},

		], function (err, user) {
			callback(err, user);
		});
	};
};

// User Instance Methods: attaches functionality related to existing instances of the object
function UserInstanceMethods (schema) {

	/**
	 * Formats an existing user for the client
	 * @memberof api/model/User
	 * @param {function(err, user)} callback Callback function
	 */
	schema.methods.format = function (callback) {

		// Initialize formatted object
		var thisObject = this.toObject();

		// Format date
		thisObject.formattedDateCreated = Moment(thisObject.dateCreated*1000).format('MMM Do, YYYY')

		Async.waterfall([

			// Attach annotation metadata
			function (callback) {
				Database.find({
					'model': Mongoose.model('Annotation'),
					'query': {
						'user': thisObject.guid,
					}
				}, function (err, annotations) {
					if (!err && annotations) {
						thisObject.annotationCount = annotations.length
					} else {
						thisObject.annotationCount = 0
					}
					callback();
				});
			},

			// Attach event metadata
			function (callback) {

				// Only process if there are events
				if (!thisObject.events || thisObject.events.length == 0) 
					return callback()

				// Add formatted admin event to object
				let event = thisObject.events[0]
				let eventDate = Moment(parseInt(event.date*1000, 10)).format('M/D/YY') + ' at ' +
					Moment(parseInt(event.date*1000, 10)).format('h:mma')
				let eventRole = event.role.charAt(0).toUpperCase() + event.role.slice(1)
				Database.findOne({
					'model': Mongoose.model('User'),
					'query': {
						'guid': event.user,
					},
				}, function(err, user) {
					if (!err && user) {
						thisObject.adminEvent = 
							`Role set to ${eventRole} by ${user.name} on ${eventDate}`
					} else {
						thisObject.adminEvent = 
							`Role set to ${eventRole} by unknown user on ${eventDate}`
					}
					callback()
				})
			}

		], function (err) {
			callback(err, thisObject);
		})
	};

	/**
	 * Updates an existing user
	 * @memberof api/model/User
	 * @param {Object} params
	 * @param {String} [params.name] Name of user
	 * @param {String} [params.role] Role of user
	 * @param {function(err, user)} callback Callback function
	 */
	schema.methods.edit = function ({
		name, role, editingUser
	}, callback) {

		// Save reference to model
		var User = this;

		let set = {}

		// Setup administrative event
		if (editingUser && role) {
			let events = this.events
			events.unshift({
				'date': Dates.now(),
				'user': editingUser,
				'role': role
			})
			set.events = events
			set.role = role
		}

		// Basic edits
		if (name) set.name = name

		// Make database update
		Database.update({
			'model': User.constructor,
			'query': {
				'guid': this.guid,
			},
			'update': {
				'$set': set
			},
		}, function (err, user) {
			callback(err, user);
		});
	};

};

// Make schema for new user object...
const userSchema = new Mongoose.Schema;

// Inherit Object properties and methods
require('./Object')(userSchema);

// Add user properties and methods to schema
UserProperties(userSchema);
UserStaticMethods(userSchema);
UserInstanceMethods(userSchema);

// Return new model object
module.exports = Mongoose.model('User', userSchema)