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
			'type': {
				'type': String,
				'enum': Messages.userEvents,
				'required': true,
			},
			'date': {
				'type': Number,
				'required': true,
			},
			'user': {
				'type': String,
			},
			'role': {
				'type': String,
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

			// Add formatted "userRoleChanged" admin event to object 
			function (callback) {

				// Only process if there are events
				if (!thisObject.events || thisObject.events.length == 0) 
					return callback()

				// Find most recent user role change event
				Async.eachSeries(thisObject.events, (event, callback) => {
					if (event.type === Messages.EVENT_USER_ROLE_CHANGE) {
						let eventDate = Moment(parseInt(event.date*1000, 10)).format('M/D/YY') + ' at ' +
						Moment(parseInt(event.date*1000, 10)).format('h:mma')
						let eventRole = event.role.charAt(0).toUpperCase() + event.role.slice(1)
						Database.findOne({
							'model': Mongoose.model('User'),
							'query': {
								'guid': event.user,
							},
						}, (err, user) => {
							if (!err && user) {
								thisObject.adminEvent = 
									`Role set to ${eventRole} by ${user.name} [${user.email}] on ${eventDate}`
							} else {
								thisObject.adminEvent = 
									`Role set to ${eventRole} by unknown user on ${eventDate}`
							}
							callback({}) // Callback with empty error to exit iteration
						})
					} else {
						callback() // Iterate to next event if not a match
					}
				}, function (err) {
					callback() // Don't use error, error specifies a matched event
				})
			}
		], function (err) {
			callback(err, thisObject);
		})
	};

	/**
	 * Updates an existing user with an event
	 * @memberof api/model/User
	 * @param {Object} params
	 * @param {String} params.event Event to log
	 * @param {String} [params.actingUser] GUID of acting user
	 * @param {function(err, user)} callback Callback function
	 */
	schema.methods.log = function ({
		actingUser, event
	}, callback) {

		// Validate paremeters
		if (!event) {
			return callback("Must include event")
		} else if (!Messages.userEvents.includes(event)) {
			return callback("Invalid event provided")
		}

		var User = this;
		let events = this.events

		let setEvent = {
			'type': event,
			'date': Dates.now(),
		}
		if (actingUser) setEvent.user = actingUser;
		events.unshift(setEvent)

		// Make database update
		Database.update({
			'model': User.constructor,
			'query': {
				'guid': this.guid,
			},
			'update': {
				'$set': { events }
			},
		}, function (err, user) {
			callback(err, user);
		});
	};

	/**
	 * Updates an existing user
	 * @memberof api/model/User
	 * @param {Object} params
	 * @param {String} [params.name] Name of user
	 * @param {String} [params.password] Password
	 * @param {String} [params.role] Role of user
	 * @param {String} [params.editingUser] GUID of editing user
	 * @param {function(err, user)} callback Callback function
	 */
	schema.methods.edit = function ({
		name, email, password, editingUser, role
	}, callback) {

		var User = this;
		let events = this.events
		let set = {}

		// Handle basic updates (audited)
		if (name) {
			set.name = name
			events.unshift({
				'type': Messages.EVENT_USER_NAME_CHANGE,
				'date': Dates.now(),
			})
			set.events = events
		}
		if (email) {
			set.email = email
			events.unshift({
				'type': Messages.EVENT_USER_EMAIL_CHANGE,
				'date': Dates.now(),
			})
			set.events = events
		}

		// Handle password update (audited)
		if (password) {
			set.password = password
			events.unshift({
				'type': Messages.EVENT_USER_PASSWORD_CHANGE,
				'date': Dates.now(),
			})
			set.events = events
		}

		// Handle role update (audited)
		if (role) {
			set.role = role
			events.unshift({
				'type': Messages.EVENT_USER_ROLE_CHANGE,
				'date': Dates.now(),
				'user': editingUser,
				'role': role
			})
			set.events = events
		}

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