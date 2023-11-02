
// Handle query parameters
$(document).ready(() => {
    let url = window.location.href;
    if (url.includes("expired=true")) {
        $("#expired").addClass("show")
    }
})

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
                    window.scrollTo(0,0)
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
                    window.scrollTo(0,0)
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

// User List
// Handles the user list in the admin template
function userList() {
    return {

        loading: false,
        errorMessage: "",
        users: [],
        
        modal: {
            show: false,
            loading: false,
            buttonText: "Save",
            errorMessage: "",
            user: {}
        },

        init() {
            this.loading = true
            fetchAPI({
                path: "user.list",
                body: {
                    pageSize: 20,
                },
                success: (data) => {
                    this.errorMessage = ""
                    this.users = data.users
                },
                failure: (data) => {
                    this.errorMessage = data.message
                },
                final: () => {
                    this.loading = false
                }
            })
        },
        edit(guid) {
            this.modal.show = true
            this.modal.loading = true
            fetchAPI({
                path: "user.getGUID",
                body: {
                    guid: guid,
                },
                success: (data) => {
                    this.modal.user = data.user
                },
                failure: (data) => {
                    this.modal.errorMessage = data.message
                },
                final: () => {
                    this.modal.loading = false
                }
            })
        },
        save() {
            this.modal.buttonText = "Loading..."
            fetchAPI({
                path: "user.editGUID",
                body: {
                    guid: this.modal.user.guid,
                    role: this.modal.user.role
                },
                success: (data) => {
                    this.modal.user = data.user
                    for (let i in this.users) {
                        if (this.users[i].guid == data.user.guid) {
                            this.users[i] = data.user
                            break
                        }
                    }
                    this.modal.show = false
                },
                failure: (data) => {
                    this.modal.errorMessage = data.message
                },
                final: () => {
                    this.modal.buttonText = "Save"
                }
            })
        },
        close() {
            this.modal.show = false
        }
    }
}

// Annotation list
// Handles the annotation list in the admin template
function annotationList() {
    return {

        heading: "",
        loading: false,
        errorMessage: "",
        annotations: [],

        init() {
            const user = Alpine.store('auth').user

            if (user.role == "annotator") this.heading = "Your Annotations"
            else this.heading = "Annotations"

            this.loading = true

            let body = {
                pageSize: 20,
            }
            if (user.role == "annotator") body.user = user.guid
            fetchAPI({
                path: "annotation.list",
                body: body,
                success: (data) => {
                    this.errorMessage = ""
                    this.annotations = data.annotations
                },
                failure: (data) => {
                    this.errorMessage = data.message
                },
                final: () => {
                    this.loading = false
                }
            })
        },
        edit(annotation) {
            Alpine.store('annotation').openModal({
                guid: annotation.guid,
                text: annotation.text,
                scope: this,
            })
        },
        populate: function (annotation) {
            for (let i in this.annotations) {
                if (this.annotations[i].guid == annotation.guid) {
                    this.annotations[i] = annotation
                    break
                }
            }
        },
    }
}