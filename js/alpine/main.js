
// Alpine Initializations
document.addEventListener('alpine:init', () => {

    // "auth" store
    Alpine.store('auth', {
        loggedIn: false,
        token: null,
        user: {},

        init() {
            const token = localStorage.getItem("token")
            const user = localStorage.getItem("user")
            const loggedIn = token !== null
            
            this.loggedIn = loggedIn
            if (loggedIn) {
                this.token = token
                this.user = JSON.parse(user)
            } else {
                this.token = null
                this.user = null
            }
        },
        login(data) {
            localStorage.setItem("token", data.token)
            localStorage.setItem("user", JSON.stringify(data.user))
            this.init()
        },
        logout() {
            localStorage.removeItem("token")
            localStorage.removeItem("user")
            this.init()
        }
    })
})