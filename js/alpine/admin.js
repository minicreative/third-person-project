
// Login
// Handles the login form in the admin template
function login() {
    return {

        email: "",
        password: "",
        buttonText: "Log in",
        errorMessage: "",
        response: {},

        init() {
            this.email = ""
            this.password = ""
            this.buttonText = "Log in",
            this.errorMessage = ""
            this.response = {}
        },
        submit() {
            this.buttonText = "Loading..."
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
                this.response = response
                return response.json()
            })
            .then(data => {
                this.buttonText = "Log in"
                if (!this.response.ok) this.errorMessage = data.message
                else {
                    Alpine.store('auth').login(data)
                    this.init()
                }
            })
        }
    }
}

// Signup
// Handles the signup form in the admin template
function signup() {
    return {

        // Form models 
        name: "",
        email: "",
        password: "",
        password_confirm: "",
        buttonText: "Sign up",
        errorMessage: "",
        response: {},

        init() {
            this.name = ""
            this.email = ""
            this.password = ""
            this.password_confirm = ""
            this.response = {}
            this.buttonText = "Sign up"
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
                this.buttonText = "Sign up"
                if (!this.response.ok) this.errorMessage = data.message
                else {
                    Alpine.store('auth').login(data)
                    this.init()
                }
            })
        }
    }
}