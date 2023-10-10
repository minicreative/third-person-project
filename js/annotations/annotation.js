
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
        let selection = window.getSelection().toString()
        if (selection.length > 0) {
            Alpine.store('annotation').openModal({
                text: selection,
                context: $("#page-slug").text()
            })
        }
        endAnnotation()
    })
}
 
// Alpine Store: Annotation
// State and functionality for creating & editing an annotation
document.addEventListener('alpine:init', () => {

    // "auth" store
    Alpine.store('annotation', {
        
        editor: false,
        guid: "",
        text: "",
        body: "",
        context: "",
        heading: "",
        attribution: "",
        saveButtonText: "Save",
        errorMessage: "",
        showModal: false,

        init() {
            this.guid = ""
            this.errorMessage = ""
            this.body = ""
            this.author = ""
        },
        openModal({ guid, text, context }) {
            this.init()

            // Populate modal
            this.text = text
            this.context = context

            // Handle existing annotation
            if (guid) {
                this.guid = guid
                this.heading = "Annotation"

                // Fetch annotation
                if (this.body)
                this.body = "Loading annotation..."
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
                        this.errorMessage = data.message
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
            setTimeout(() => {
                tinymce.init({
                    selector: '#annotation-editor',
                    promotion: false,
                    menubar: false,
                    plugins: 'link',
                    toolbar: 'h2 h3 | bold italic underline | link | undo redo',
                    init_instance_callback: () => {
                        if (body) {
                            tinymce.get("annotation-editor").setContent(body)
                        }
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
            this.body = annotation.body
            this.author = annotation.attribution ? annotation.attribution : annotation.userName
        },

        // Actions
        edit() {
            this.heading = "Edit annotation"
            this.initializeEditor(this.body)
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

            let path = "annotation.create"
            if (this.guid) path = "annotation.edit"

            let body = {
                text: this.text,
                body: tinymce.get("annotation-editor").getContent()
            }
            if (this.attribution) body.attribution = this.attribution // TODO: Only set attribution in body if user is able to see field
            if (this.context) body.context = this.context
            if (this.guid) body.guid = this.guid

            fetchAPI({
                path,
                body,
                success: ({ annotation }) => {
                    if (!this.guid) addAnnotationsToTranscript([annotation])
                    this.populate(annotation)
                    this.removeEditor()
                },
                failure: (data) => {
                    this.errorMessage = data.message
                },
                final: () => {
                    this.saveButtonText = "Save"
                }
            })
        }
    })
})