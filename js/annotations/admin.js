
// Login
// Handles the login form in the admin template
function login() {
    return {

        email: "",
        password: "",
        buttonText: "Log in",
        errorMessage: "",

        init() {
            this.email = ""
            this.password = ""
            this.buttonText = "Log in",
            this.errorMessage = ""
        },
        submit() {
            this.errorMessage = ""
            this.buttonText = "Loading..."

            fetchAPI({
                path: "user.login",
                body: {
                    email: this.email,
                    password: this.password
                },
                success: (data) => {
                    Alpine.store('auth').login(data)
                    this.init()
                },
                failure: (data) => {
                    this.errorMessage = data.message;
                },
                final: () => {
                    this.buttonText = "Log in"
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

        init() {
            this.name = ""
            this.email = ""
            this.password = ""
            this.password_confirm = ""
            this.buttonText = "Sign up"
            this.errorMessage = ""
        },
        submit() {

            // Client-side validations
            if (this.password !== this.password_confirm) {
                this.errorMessage = "The passwords do not match"
                return
            }

            fetchAPI({
                path: "user.create",
                body: {
                    name: this.name,
                    email: this.email,
                    password: this.password
                },
                success: (data) => {
                    Alpine.store('auth').login(data)
                    this.init()
                },
                failure: (data) => {
                    this.errorMessage = data.message;
                },
                final: () => {
                    this.buttonText = "Log in"
                }
            })
        }
    }
}