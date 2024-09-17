/** @namespace api/tools/Messages */
// Messages.js: holds messages

const DRAFT = 'draft'
const EDITED = 'edited'
const REVIEWED = 'reviewed'
const FLAGGED = 'flagged'
const PUBLISHED = 'published'

const ANNOTATOR = 'annotator'
const EDITOR = 'editor'
const ADMINISTRATOR = 'administrator'

const EVENT_USER_NAME_CHANGE = "userNameChange"
const EVENT_USER_EMAIL_CHANGE = "userEmailChange"
const EVENT_USER_ROLE_CHANGE = "userRoleChange"
const EVENT_USER_PASSWORD_CHANGE = "userPasswordChange"
const EVENT_USER_PASSWORD_FORGOT = "userPasswordForgot"
const EVENT_USER_DELETE = "userDelete"

const EVENT_ANNOTATION_EDIT = "annotationEdit"
const EVENT_ANNOTATION_DELETE = "annotationDelete"

module.exports = {

	DRAFT: DRAFT,
	EDITED: EDITED,
	REVIEWED: REVIEWED,
	FLAGGED: FLAGGED,
	PUBLISHED: PUBLISHED,

	ANNOTATOR: ANNOTATOR,
	EDITOR: EDITOR,
	ADMINISTRATOR: ADMINISTRATOR,

	EVENT_USER_ROLE_CHANGE: EVENT_USER_ROLE_CHANGE,
	EVENT_USER_NAME_CHANGE: EVENT_USER_NAME_CHANGE,
	EVENT_USER_EMAIL_CHANGE: EVENT_USER_EMAIL_CHANGE,
	EVENT_USER_PASSWORD_CHANGE: EVENT_USER_PASSWORD_CHANGE,
	EVENT_USER_PASSWORD_FORGOT: EVENT_USER_PASSWORD_FORGOT,
	EVENT_USER_DELETE: EVENT_USER_DELETE,

	EVENT_ANNOTATION_EDIT: EVENT_ANNOTATION_EDIT,
	EVENT_ANNOTATION_DELETE: EVENT_ANNOTATION_DELETE,

	/** Status Enumerations
	 * @memberof api/tools/Messages
	 */
	'statuses': [DRAFT, EDITED, REVIEWED, FLAGGED, PUBLISHED],

	/** Role Enumerations
	 * @memberof api/tools/Messages
	 */
	'roles': [ANNOTATOR, EDITOR, ADMINISTRATOR],

	/** User Event Enumerations
	 * @memberof api/tools/Messages
	 */
	'userEvents': [
		EVENT_USER_ROLE_CHANGE,
		EVENT_USER_NAME_CHANGE,
		EVENT_USER_EMAIL_CHANGE,
		EVENT_USER_PASSWORD_CHANGE,
		EVENT_USER_PASSWORD_FORGOT,
		EVENT_USER_DELETE
	],

	/** Annotation Event Enumerations
	 * @memberof api/tools/Messages
	 */
	'annotationEvents': [
		EVENT_ANNOTATION_EDIT,
		EVENT_ANNOTATION_DELETE
	],

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
		'notFoundError': 404,
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
		'userRoleChanged': "You user role was changed. Please sign in again to continue",
		'userDeleted': "This account was deleted. Please contact an administrator",
		'expired': "Your session has expired. Please sign in again to continue",
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
	 * Request error messages
	 * @memberof api/tools/Messages
	 */
	'requestErrors': {
		'passwordIncorrect': "Incorrect password",
		'passwordCurrentIncorrect': "Current password is incorrect",
	},

	/**
	 * Not found error messages
	 * @memberof api/tools/Messages
	 */
	'notFoundErrors': {
		'objectNotFound': "Object not found in the database",
		'emailNotFound': "Email not recognized",
	},

	/**
	 * Conflict error messages
	 * @memberof api/tools/Messages
	 */
	'conflictErrors': {
		'emailAlreadyUsed': "An account with this email already exists",
	},

	/**
	 * Success messages
	 * @memberof api/tools/Messages
	 */
	'successMessages': {
		'passwordResetLink': "A password reset link has been sent to your email.",
	},

	/**
	 * Function to create the body of a "Forgot your password" email
	 * @memberof api/tools/Messages
	 * @param {String} token Forgot password token
	 * @return {String} HTML string
	 */
	'forgotPasswordEmail': function(token) {
		let html = "";
		html += "<p><b>Hello from Third Person Project!</b></p>";
		html += "<p>We received a request to reset the password on your account. If you didn't make this request, please ignore this email and consider changing your password.</p>";
		html += `<p>If you did request a password reset, <a href='https://thirdpersonproject.org/reset-password?token=${token}' clicktracking=off>click here to reset your password.</a></p>`;
		return html;
	},

};