
const BUFFER_LENGTH = 10
const MAX_SELECTION = 100

// Add Annotation: handles 'Add annotation' button click
function addAnnotation(e) {
    let transcriptArea = $(".transcript").first()
    let annotationNote = $("#annotation-note")

    // Function to set annotation tooltip location
    function annotationTooltip(e) {
        annotationNote.addClass("show")
        annotationNote.css("top", e.pageY+10+'px')
        annotationNote.css("left", e.pageX+10+'px')
    }
    annotationTooltip(e)

    // Function to remove all handlers after annotation is finished
    function endAnnotation() {
        annotationNote.removeClass("show")
        transcriptArea.off("mouseup")
        transcriptArea.off("mousemove")
        transcriptArea.off("mouseup")
        setTimeout(() => {
            $(window).unbind("contextmenu")
        }, 20) 
    }

    // Update tooltip to follow mouse
    transcriptArea.on("mousemove", function(e) {
        annotationTooltip(e)
    })

    // Detect right click to cancel, disable context menu
    transcriptArea.on("mousedown", function(e) {
        if (e.which === 3) {
            annotationNote.removeClass("show")
            endAnnotation()
        }
    })
    $(window).bind("contextmenu", function (e) {
        e.preventDefault()
        return false
    })

    // Detect end of highlight
    transcriptArea.on("mouseup", function(e) {

        // Get selection
        let selection = window.getSelection()
        let selectionString = selection.toString()

        // Don't allow selections greater than max
        if (selectionString.length > MAX_SELECTION) {
            window.alert("Please make a selection of no more than 100 characters.")
            endAnnotation()
            return
        }

        // Get context from selection
        let textBefore = ""
        if (selection.baseNode && selection.baseNode.textContent) {
            textBefore = selection.baseNode.textContent.substring(selection.baseOffset - BUFFER_LENGTH, selection.baseOffset)
        }
        let textAfter = ""
        if (selection.focusNode && selection.focusNode.textContent) {
            textAfter = selection.focusNode.textContent.substring(selection.focusOffset, selection.focusOffset + BUFFER_LENGTH)
        }

        if (selectionString.length > 0) {
            Alpine.store('annotation').openModal({
                text: selectionString,
                textBefore,
                textAfter,
                context: $("#page-slug").text().replace("daily-record-","")
            })
        }
        endAnnotation()
    })
}

// Remove Annotation from Page: removes an annotation from the DOM
function removeAnnotationFromPage(guid) {
    let annotation = $(`#${guid}`)
    if (annotation.get(0).tagName === "SPAN") {
        let html = annotation.html()
        annotation.get(0).replaceWith(html)
    } else if (annotation.get(0).tagName === "TR") {
        annotation.get(0).remove()
    }
}
 
// Alpine Store: Annotation
// State and functionality for creating & editing an annotation
document.addEventListener('alpine:init', () => {

    // "auth" store
    Alpine.store('annotation', {
        
        editor: false,
        loadingEditor: false,
        canEdit: false,
        guid: "",
        text: "",
        body: "",
        context: "",
        heading: "",
        attribution: "",
        status: "",
        statusOptions: [],
        saveButtonText: "Save",
        deleteButtonText: "Delete",
        errorMessage: "",
        showModal: false,

        init() {
            this.loadFormOptions()
            this.guid = ""
            this.errorMessage = ""
            this.body = ""
            this.attribution = ""
            this.status = ""
            this.scope = null
        },
        loadFormOptions() {
            fetchAPI({
                path: "annotation.getStatusOptions",
                body: {},
                success: (data) => {
                    this.statusOptions = data.options
                }
            })
        },
        openModal({ guid, text, textBefore, textAfter, context, scope }) {
            this.init()

            // Populate scope
            if (scope) this.scope = scope

            // Populate modal
            this.text = text
            this.context = context

            // Populate with selection context if provided
            if (textBefore !== undefined && textAfter !== undefined) {
                this.textBefore = textBefore
                this.textAfter = textAfter
            }

            // Handle existing annotation
            if (guid) {
                this.guid = guid
                this.heading = "Annotation"

                // Fetch annotation
                this.body = "<p>Loading annotation...</p>"
                fetchAPI({
                    path: "annotation.get",
                    body: {
                        guid: guid
                    },
                    success: ({ annotation }) => {
                        this.populate(annotation)
                    },
                    failure: (data) => {
                        this.body = ""
                        Alpine.store('messages').post({
                            type: 'error',
                            text: data.message,
                        })
                    }
                })
            }

            // Handle new annotation
            else {
                this.heading = "Create a new annotation"
                this.initializeEditor()
            }

            // Open modal
            this.showModal = true

        },

        // Helper functions
        initializeEditor (body) {
            this.editor = true
            this.loadingEditor = true
            let annotationModal = this
            setTimeout(() => {
                tinymce.init({
                    selector: '#annotation-editor',
                    promotion: false,
                    menubar: false,
                    plugins: 'link',
                    toolbar: 'h2 h3 | bold italic underline | link | undo redo',
                    init_instance_callback: () => {
                        annotationModal.loadingEditor = false
                        if (body) tinymce.get("annotation-editor").setContent(body)
                    }
                })
            }, 20)
        },
        removeEditor() {
            this.editor = false
            this.heading = "Annotation"
            tinymce.remove("#annotation-editor")
        },
        populate(annotation) {

            // Setup static fields
            this.guid = annotation.guid
            this.body = annotation.body
            this.attribution = annotation.attribution
            this.author = annotation.attribution ? annotation.attribution : annotation.userName
            this.status = annotation.status
            
            // Setup canEdit boolean
            let user = Alpine.store('auth').user
            if (!user) {
                this.canEdit = false
            } else if (user.role === "annotator") {
                if (annotation.user === user.guid) this.canEdit = true
                else this.canEdit = false
            } else {
                this.canEdit = true
            }
        },

        // Actions
        edit() {
            this.heading = "Edit annotation"
            this.initializeEditor(this.body)
        },
        delete() {
            this.deleteButtonText = "Deleting..."
            fetchAPI({
                path: "annotation.delete",
                body: {
                    guid: this.guid,
                },
                success: () => {
                    removeAnnotationFromPage(this.guid)
                    this.close()

                    Alpine.store('messages').post({
                        type: 'info',
                        text: "Annotation deleted!"
                    })
                },
                failure: (data) => {
                    Alpine.store('messages').post({
                        type: 'error',
                        text: data.message,
                    })
                },
                final: () => {
                    this.deleteButtonText = "Delete"
                }
            })
        },
        close() {
            this.showModal = false
            this.removeEditor()
        },
        cancel() {
            if (this.guid) {
                this.errorMessage = ""
                this.removeEditor()
            }
            else this.close()
        },
        save() {
            this.saveButtonText = "Loading..."
            this.errorMessage = ""

            let user = Alpine.store('auth').user

            let path = "annotation.create"
            if (this.guid) path = "annotation.edit"

            let body = {
                text: this.text,
                body: tinymce.get("annotation-editor").getContent()
            }
            if (this.textBefore !== undefined) body.textBefore = this.textBefore
            if (this.textAfter !== undefined) body.textAfter = this.textAfter
            if (this.context) body.context = this.context
            if (this.guid) body.guid = this.guid
            if (user.role === "editor" || user.role === "administrator") {
                body.attribution = this.attribution
                body.status = this.status
            }

            fetchAPI({
                path,
                body,
                success: ({ annotation }) => {
                    if (!this.guid) addAnnotationsToTranscript([annotation])
                    if (this.scope) this.scope.populate(annotation)
                    this.populate(annotation)
                    this.removeEditor()

                    let messageText = "Annotation created!"
                    if (path == "annotation.edit") messageText = "Annotation updated!"
                    Alpine.store('messages').post({
                        type: 'info',
                        text: messageText
                    })
                },
                failure: (data) => {
                    Alpine.store('messages').post({
                        type: 'error',
                        text: data.message,
                    })
                },
                final: () => {
                    this.saveButtonText = "Save"
                }
            })
        }
    })
})