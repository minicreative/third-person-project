const Express = require('express')
const Morgan = require('morgan')

const api = require('./api')

const REQUIRED_ENV = [
	'tpp_port',
	'tpp_secret',
	'tpp_mongo_host',
	'tpp_mongo_name',
	'tpp_mongo_user',
	'tpp_mongo_pass',
];

// Start dependenies and listen to port
async function start () {

	// Check for required environment variables
	for (const ev of REQUIRED_ENV) {
		if (process.env[ev] === undefined) {
			console.log(`Missing required env variable: ${ev}`)
			return
		}
	}

	// Setup server
	const server = Express()
	server.use(Morgan('tiny'))

	// Setup API
	await api.setup(server)

	// Listen on port
	server.listen(process.env.tpp_port, () => console.log(`money-tracker listening on port ${process.env.tpp_port}...`))
}

start()
