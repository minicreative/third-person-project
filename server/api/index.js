const BodyParser = require('body-parser')
const Cors = require('cors')
const Express = require('express')

const Database = require('./tools/Database')
const Messages = require('./tools/Messages')
const Secretary = require('./tools/Secretary')

module.exports = {
	setup: async (server) => {
		
		// Start database
		await Database.setup()

		// Setup router
		const router = Express.Router()
		server.use('/', router)

		// Configure router
		router.use(BodyParser.json({
			limit: '20mb'
		}))
		router.use(Cors())

		// Import individual route collections
		require('./routes/User')(router)
		require('./routes/Annotation')(router)

		// Set root route, configure router
		router.get('/', (req, res) => {
			res.send('Welcome to the Third Person Project API')
		});

		// Middleware: Handle errors
		router.use((err, req, res, next) => {
			if (!err) return next();

			// >400: Handled errors
			if (err.handledError) {
				res.status(err.code).json({message: err.message})
			} 
			
			// 500: Unhandled errors
			else {
				console.log(err)
				res.status(Messages.codes.serverError).json({message: Messages.serverError});
			}
		});

		// Middleware: Catch all
		router.use((req, res) => {

			// 404: Request not found (not handled)
			if (!req.handled) {
				res.status(404).end()
				return;
			}

			// 200: Request completed, response prepared without errors
			Secretary.prepareResponse(res, err => {
				if (err) {
					res.status(500).json({message: Messages.serverError})
					return
				}
				res.status(200).json(res.body);
			});
		})
	}
}
