/** @namespace api/tools/Database */
// Database.js: provides tools for accessing / updating the database

// Import dependencies
const Mongoose = require('mongoose')

module.exports = {

	/**
	 * Returns a MongoDB query object to match documents using text
	 * @memberof api/tools/Database
	 * @param {String} term Term
	 * @return {Object} $text filter object
	 */
	text: (term) => {
		return {
			'$regex': term,
			'$options': "i"
		}
	},

	/**
	 * Finds a single object in the database using model
	 * @memberof api/tools/Database
	 * @param {Object} params
	 * @param {Object} params.model Mongoose model object
	 * @param {Object} params.query MongoDB query object
	 * @param {function (err, object)} callback Callback function
	 */
	findOne: ({model, query}, callback) => {
		model.findOne(query)
			.then(function(object) {
				callback(null, object)
			})
			.catch(function(err) {
				callback(err)
			})
	},

	/**
	 * Finds all objects in the database for a query using model
	 * @memberof api/tools/Database
	 * @param {Object} params
	 * @param {Object} params.model Mongoose model object
	 * @param {Object} params.query MongoDB query object
	 * @param {function (err, objects)} callback Callback function
	 */
	find: ({model, query}, callback) => {
		model.find(query)
			.then(function(objects) {
				callback(null, objects)
			})
			.catch(function(err) {
				callback(err)
			})
	},

	/**
	 * Finds a limited, sorted list of objects in the database using model
	 * @memberof api/tools/Database
	 * @param {Object} params
	 * @param {Object} params.model Mongoose model object
	 * @param {Object} params.query MongoDB query object
	 * @param {Number} params.pageSize Number of objects needed
	 * @param {String} params.sort Object property to sort by
	 * @param {Number} params.skip Number of objects to skip at the beginning of sorted query
	 * @param {function (err, objects)} callback Callback function
	 */
	page: ({model, query, pageSize, sort, skip}, callback) => {
		model.find(query).sort(sort).skip(skip).limit(pageSize).exec()
			.then(function(objects) {
				callback(null, objects)
			})
			.catch(function(err) {
				callback(err)
			})
	},

	/**
	 * Queries and updates an object in the database using model
	 * @memberof api/tools/Database
	 * @param {Object} params
	 * @param {Object} params.model Mongoose model object
	 * @param {Object} params.query MongoDB query object
	 * @param {Number} params.update MongoDB update query object
	 * @param {function (err, object)} callback Callback function
	 */
	update: ({model, query, update}, callback) => {

		// Setup options
		var options = {
			'setDefaultsOnInsert': true, // Adds default properties to database object
			'runValidators': true, // Allows mongoDB to validate update
			'returnDocument': 'after', // Returns the modified document
			'upsert': true, // If a document isn't found, make one based on query
		};

		// Setup query
		if (!update.$set) update.$set = {}; // Make a set operation if one isn't defined in the update
		if (!update.$setOnInsert) update.$setOnInsert = {}; // Make a setOnInsert operation if one isn't defined in the update

		// Make query and update with Mongoose
		model.findOneAndUpdate(query, update, options)
			.then(function(object) {
				callback(null, object)
			})
			.catch(function(err) {
				callback(err)
			})
	},

	setup: () => {
		process.stdout.write(`Connecting to Mongo at ${process.env.tpp_mongo_host}...`)
		const auth = `${process.env.tpp_mongo_user}:${process.env.tpp_mongo_pass}`
		return Mongoose.connect(`mongodb://${auth}@${process.env.tpp_mongo_host}/${process.env.tpp_mongo_name}`)
			.then(() => {
				process.stdout.write(' done!\n')
			})
			.catch(err => {
				process.stderr.write('Database error: '+err.stack+'\n')
				process.exit(0)
			})
	},
}


