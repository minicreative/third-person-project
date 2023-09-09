
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
            Alpine.store('annotation').openEditor({
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
        text: "",
        body: "",
        context: "",
        heading: "",
        buttonText: "Save",
        errorMessage: "",
        showModal: false,

        init() {
            this.errorMessge = ""
            this.body = ""
        },
        openEditor({ text, body, context, edit }) {
            this.init()
            this.editor = true

            // Populate modal
            this.text = text
            this.context = context
            if (edit) {
                this.heading = "Edit annotation"
            }
            else this.heading = "Create a new annotation"
            this.errorMessage = ""

            // Open modal
            this.showModal = true

            // Initialize TinyMCE
            setTimeout(() => {
                tinymce.init({
                    selector: '#annotation-editor',
                    promotion: false,
                    menubar: false,
                    plugins: 'link',
                    toolbar: 'h2 h3 | bold italic underline | link | undo redo',
                    init_instance_callback: () => {
                        if (edit) {
                            tinymce.get("annotation-editor").setContent(body)
                        }
                    }
                })
            }, 20)
        },
        openViewer({ text, guid }) {
            this.init()
            this.editor = false;

            // Populate modal
            this.heading = "Annotation"
            this.text = text

            // Open modal
            this.showModal = true;

            // Fetch annotation
            this.body = "Loading annotation..."
            fetchAPI({
                path: "annotation.get",
                body: {
                    guid: guid
                },
                success: ({ annotation }) => {
                    this.body = annotation.body
                },
                failure: (data) => {
                    this.body = ""
                    this.errorMessage = data.message
                }
            })
        },
        close() {
            this.showModal = false
            tinymce.remove("#annotation-editor")
        },
        save() {
            this.buttonText = "Loading..."
            this.errorMessage = ""
            fetchAPI({
                path: "annotation.create",
                body: {
                    context: this.context,
                    text: this.text,
                    body: tinymce.get("annotation-editor").getContent()
                },
                success: ({ annotation }) => {
                    addAnnotationsToTranscript([annotation])
                    this.close()
                },
                failure: (data) => {
                    this.errorMessage = data.message
                },
                final: () => {
                    this.buttonText = "Save"
                }
            })
        }
    })
})