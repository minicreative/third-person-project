/** @namespace api/tools/Messages */
// Messages.js: holds messages

const DRAFT = 'draft'
const EDITED = 'edited'
const REVIEWED = 'reviewed'
const PUBLISHED = 'published'
const ANNOTATOR = 'annotator'
const EDITOR = 'editor'
const ADMINISTRATOR = 'administrator'

module.exports = {

	DRAFT: DRAFT,
	EDITED: EDITED,
	REVIEWED: REVIEWED,
	PUBLISHED: PUBLISHED,
	ANNOTATOR: ANNOTATOR,
	EDITOR: EDITOR,
	ADMINISTRATOR: ADMINISTRATOR,

	/** Status Enumerations
	 * @memberof api/tools/Messages
	 */
	'statuses': [DRAFT, EDITED, REVIEWED, PUBLISHED],

	/** Role Enumerations
	 * @memberof api/tools/Messages
	 */
	'roles': [ANNOTATOR, EDITOR, ADMINISTRATOR],

	/**
	 * HTTP Response Codes
	 * @memberof api/tools/Messages
	 */
	'codes': {
		'success': 200,
		'serverError': 500,
		'requestError': 400,
		'unauthenticatedError': 401,
		'unauthorizedError': 403,
		'conflictError': 409
	},

	/**
	 * Authentication messages
	 * @memberof api/tools/Messages
	 */
	'authErrors': {
		'invalidToken': "Invalid token",
		'missingToken': "Missing authentication token",
		'unauthentication': "Unauthenticated",
		'userRoleChanged': "User role changed, authentication no longer valid, please sign in again",
		'expired': "Authentication expired, please sign in again",
		'unauthorized': "Unauthorized",
		'notAdmin': "Only an administrator can view or edit users besides themselves",
		'annotatorStatusCreate': "An annotator cannot provide a status for a new annotation",
		'annotatorStatusEdit': "An annotator cannot edit an annotation's status",
		'annotatorEdit': "An annotator cannot edit another user's annotation",
		'annotatorDelete': "An annotator cannot delete another user's annotation",
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
	}
};