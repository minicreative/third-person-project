/** @namespace api/tools/Messages */
// Messages.js: holds messages

module.exports = {

	/**
	 * HTTP Response Codes
	 * @memberof api/tools/Messages
	 */
	'codes': {
		'success': 200,
		'serverError': 500,
		'requestError': 400,
		'unauthorizedError': 401,
		'conflictError': 409
	},

	/**
	 * Authentication messages
	 * @memberof api/tools/Messages
	 */
	'authErrors': {
		'invalidToken': "Invalid token",
		'missingToken': "Missing authorization token",
		'unauthorized': "Unauthorized",
		'noAccess': "Unauthorized to access object",
	},

	/**
	 * Type error messages
	 * @memberof api/tools/Messages
	 */
	'typeErrors': {
		'string': " is not a string",
		'emptyString': " is an empty string",
		'number': " is not a number",
		'array': " is not an array",
	},

	/**
	 * Field error messages
	 * @memberof api/tools/Messages
	 */
	'fieldErrors': {
		'missing': " is missing",
		'passwordLetter': " is missing a letter",
		'passwordNumber': " is missing a number",
		'isInvalid': " is invalid",
		'sortKey': " is not a valid sort key",
	},

	/**
	 * Conflict error messages
	 * @memberof api/tools/Messages
	 */
	'conflictErrors': {
		'objectNotFound': "Object not found in the database",
		'emailAlreadyUsed': "An account with this email already exists",
		'emailNotFound': "Email not recognized",
		'passwordIncorrect': "Incorrect password",
		'categoryNotFound': "Category not found in the database",
		'parentCategoryNotFound': "Parent category not found in the database",
		'invalidParentCategory': "A category's parent cannot be itself"
	}
};