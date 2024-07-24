
let PAGE_SIZE = 20

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
        query: {
            pageSize: PAGE_SIZE,
            name: "",
            email: "",
            role: "",
            sort: "name",
        },
        page: 0,
        nextPage: false,
        
        modal: {
            show: false,
            loading: false,
            buttonText: "Save",
            errorMessage: "",
            user: {}
        },

        init() {
            this.load({})
        },
        load({nextPage}) {
            this.loading = true
            updateSortIcon({
                listID: 'user-list',
                sortKey: this.query.sort,
            })
            if (!nextPage) this.page = 0;

            // Setup query
            let body = this.query
            if (this.page > 0) body.skip = this.page * PAGE_SIZE;

            fetchAPI({
                path: "user.list",
                body: body,
                success: (data) => {
                    this.errorMessage = ""
                    this.page++;

                    // Handle new page vs. fresh query
                    if (nextPage) {
                        let allUsers = this.users
                        for (let user of data.users) {
                            allUsers.push(user)
                        }
                        this.users = allUsers
                    } else {
                        this.users = data.users
                    }

                    // Determine whether to allow more paging
                    if (data.users.length == PAGE_SIZE) {
                        this.nextPage = true
                    } else {
                        this.nextPage = false
                    }
                },
                failure: (data) => {
                    this.errorMessage = data.message
                },
                final: () => {
                    this.loading = false
                }
            })
        },
        sort(e) {

            // Get sort context from target
            let sortname = $(e.target).attr("sortname")
            let reverse = !$(e.target).hasClass("reversed")
            
            // Update query
            let sortkey = sortname
            if (reverse) sortkey = "-"+sortname
            this.query.sort = sortkey
            this.load({})
        },
        watchKeypress(event) {
            if (event.keyCode === 13) this.load({})
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
                    Alpine.store('messages').post({
                        type: 'error',
                        text: data.message
                    })
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

                    Alpine.store('messages').post({
                        type: 'info',
                        text: "User updated!"
                    })
                },
                failure: (data) => {
                    Alpine.store('messages').post({
                        type: 'error',
                        text: data.message
                    })
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
        query: {
            pageSize: PAGE_SIZE,
            text: "",
            status: "",
            author: "",
            context: "",
            sort: "text",
        },
        filterEmpty: false,
        page: 0,
        nextPage: false,

        init() {
            const user = Alpine.store('auth').user

            if (user.role == "annotator") this.heading = "Your Annotations"
            else this.heading = "Annotations"

            this.load({})
        },
        load({filtered, nextPage}) {
            const user = Alpine.store('auth').user

            this.loading = true
            updateSortIcon({
                listID: "annotation-list",
                sortKey: this.query.sort,
            })
            if (!nextPage) this.page = 0;

            // Setup query
            let body = this.query
            if (this.page > 0) body.skip = this.page * PAGE_SIZE;
            if (user.role == "annotator") body.user = user.guid
            
            fetchAPI({
                path: "annotation.list",
                body: body,
                success: (data) => {
                    this.errorMessage = ""
                    this.page++;

                    // Handle new page vs. fresh query
                    if (nextPage) {
                        let allAnnotations = this.annotations
                        for (let annotation of data.annotations) {
                            allAnnotations.push(annotation)
                        }
                        this.annotations = allAnnotations
                    } else {
                        this.annotations = data.annotations
                    }

                    // Determine whether to allow more paging
                    if (data.annotations.length == PAGE_SIZE) {
                        this.nextPage = true
                    } else {
                        this.nextPage = false
                    }

                    // Handle empty filter query
                    if (filtered && data.annotations.length < 1) this.filterEmpty = true;
                    else this.filterEmpty = false;
                },
                failure: (data) => {
                    this.errorMessage = data.message
                },
                final: () => {
                    this.loading = false
                }
            })
        },
        sort(e) {

            // Get sort context from target
            let sortname = $(e.target).attr("sortname")
            let reverse = !$(e.target).hasClass("reversed")
            
            // Update query
            let sortkey = sortname
            if (reverse) sortkey = "-"+sortname
            this.query.sort = sortkey
            this.load({ filtered: true })
        },
        watchKeypress(event) {
            if (event.keyCode === 13) this.load({filtered: true})
        },
        edit(annotation) {
            Alpine.store('annotation').openModal({
                guid: annotation.guid,
                text: annotation.text,
                scope: this,
            })
        },
        erase(e, annotation) {
            // Start loading sequence
            $(e.target).removeClass("fa-trash-o")
            $(e.target).addClass("fa-spinner")

            fetchAPI({
                path: "annotation.delete",
                body: {
                    guid: annotation.guid,
                },
                success: () => {
                    Alpine.store('messages').post({
                        type: 'info',
                        text: "Annotation deleted!"
                    })
                    for (let i in this.annotations) {
                        if (this.annotations[i].guid == annotation.guid) {
                            this.annotations.splice(i, 1)
                            break
                        }
                    }
                },
                failure: (data) => {
                    $(e.target).removeClass("fa-spinner")
                    $(e.target).addClass("fa-trash-o")
                    Alpine.store('messages').post({
                        type: 'error',
                        text: data.message,
                    })
                }
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

function updateSortIcon({listID, sortKey}) {
    
    // Parse sort key
    let sortID;
    let reverse = false
    if (sortKey.charAt(0) === "-") {
        sortID = sortKey.slice(1)
        reverse = true
    } else {
        sortID = sortKey
    }

	$(`#${listID}`).find("th.sortable").each(function() {
        let columnSortName = $(this).attr('sortName')
        if (columnSortName == sortID) {
            $(this).addClass("sorted")
            if (reverse) $(this).addClass("reversed")
            else $(this).removeClass("reversed")
        } else {
            $(this).removeClass("sorted")
            $(this).removeClass("reversed")
        }
    })
}