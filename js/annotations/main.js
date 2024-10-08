
// Alpine Initializations
document.addEventListener('alpine:init', () => {

    // Auth store
    // Handles user state, login and log out
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
        update(user) {
            localStorage.setItem("user", JSON.stringify(user))
            this.init()
        },
        login(data) {
            localStorage.setItem("token", data.token)
            localStorage.setItem("user", JSON.stringify(data.user))
            this.init()
        },
        logout(redirect) {
            localStorage.removeItem("token")
            localStorage.removeItem("user")
            this.init()
            
            // Redirect OR refresh columns after logout
            if (redirect) setTimeout(() => {window.location.href = "/annotate?expired=true"}, 20)
            else setTimeout(setColumnWidth, 20)
        },
        isEditor() {
            return this.user.role === "editor" || this.user.role === "administrator"
        },
        manage() {
            let manageAccount = $("#manage-account")
            if (manageAccount.hasClass("show")) {
                manageAccount.removeClass("show")
            } else {
                manageAccount.addClass("show")
            }
        }
    })

    // Messages store
    // Handles error and success messages
    Alpine.store('messages', {
        messages: [],
        post(message) {
            message.id = Date.now()
            this.messages.push(message)

            // Remove all messages after 4 seconds
            setTimeout(() => {
                this.drop(message)
            }, 4000)
        },
        drop(message) {
            for (i in this.messages) {
                if (message.id === this.messages[i].id) {
                    this.messages.splice(i, 1)
                    break
                }
            }
        }
    })
})

// Fetch wrapper
async function fetchAPI({ path, body, temporaryToken, success, failure, final }) {

    // Setup headers
    let headers = {
        "Content-Type": "application/json",
    }
    if (temporaryToken) {
        headers.Authorization = `Bearer ${temporaryToken}`
    } else if (Alpine.store('auth').loggedIn) {
        headers.Authorization = `Bearer ${Alpine.store('auth').token}`
    }

    // Fetch, catch errors, and callback
    try {
        const response = await fetch(`${API_BASE}${path}`, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(body)
        })
        let data = await response.json()

        // Handle OK response
        if (response.ok) {
            success(data)
        } 
        
        // Handle handled errors
        else {
            if (response.status === 401) {
                if (temporaryToken) {
                    data = {
                        message: "Your password reset token has expired. Please request a new one"
                    }
                } else {
                    return Alpine.store('auth').logout(true)
                }
            }
            if (failure) failure(data)
        }

        // Run final if applicable
        if (final) final()
    } catch (error) {
        console.log(error)

        // Handle unhandled errors
        if (failure) failure({ 
            message: "An error occurred: we are unable to access the server at this time. Please try again."
        })

        // Run final if applicable
        if (final) final()
    }
}

// Helper functions ==========================
function uppercase(str) {
    return str.charAt(0).toUpperCase()+str.slice(1)
}