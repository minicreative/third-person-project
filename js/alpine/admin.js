document.addEventListener('alpine:init', () => {
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

function login() {
    return {
        email: "",
        password: "",
        errorMessage: "",
        init() {
            this.email = ""
            this.password = ""
            this.response = null
            this.errorMessage = ""
        },
        submit() {
            fetch("http://localhost:3003/user.login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: this.email,
                    password: this.password
                })
            })
            .then(response => {
                return response.json()
            })
            .then(data => {
                Alpine.store('auth').login(data)
            })
        }
    }
}

function signup() {
    return {
        name: "",
        email: "",
        password: "",
        password_confirm: "",
        errorMessage: "",
        init() {
            this.name = ""
            this.email = ""
            this.password = ""
            this.password_confirm = ""
            this.response = null
            this.errorMessage = ""
        },
        submit() {
            if (this.password !== this.password_confirm) {
                this.errorMessage = "The passwords do not match"
                return
            }

            fetch("http://localhost:3003/user.create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: this.name,
                    email: this.email,
                    password: this.password
                })
            })
            .then(response => {
                this.response = response
                return response.json()
            })
            .then(data => {
                if (!this.response.ok) this.errorMessage = data.message
                else {
                    Alpine.store('auth').login(data)
                    this.init()
                }
            })
        }
    }
}