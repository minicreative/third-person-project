
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
        }
    })

    // Error store
    // Handles error messages
    Alpine.store('error', {
        errors: [],
        post(message) {
            this.errors.push(message)
        },
    })
})

// Fetch wrapper
async function fetchAPI({ path, body, success, failure, final }) {

    // Setup headers
    let headers = {
        "Content-Type": "application/json",
    }
    if (Alpine.store('auth').loggedIn) {
        headers.Authorization = `Bearer ${Alpine.store('auth').token}`
    }

    // Fetch, catch errors, and callback
    try {
        const response = await fetch(`${API_BASE}${path}`, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(body)
        })
        const data = await response.json()

        // Handle OK response
        if (response.ok) {
            success(data)
        } 
        
        // Handle handled errors
        else {
            if (response.status === 401) {
                return Alpine.store('auth').logout(true)
            }
            failure(data)
        }

        // Run final if applicable
        if (final) final()
    } catch (error) {
        console.log(error)

        // Handle unhandled errors
        failure({
            message: "An unknown error occured"
        })

        // Run final if applicable
        if (final) final()
    }
}