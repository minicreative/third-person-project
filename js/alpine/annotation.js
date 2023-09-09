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
            Alpine.store('annotation').open({
                text: selection,
                context: $("#page-slug").text()
            })
        }
        endAnnotation()
    })
}

document.addEventListener('alpine:init', () => {

    // "auth" store
    Alpine.store('annotation', {
        
        text: "",
        body: "",
        context: "",
        heading: "",
        showModal: false,

        open({ text, body, context, edit }) {

            // Populate modal
            this.text = text
            this.context = context
            if (edit) {
                this.heading = "Edit annotation"
            }
            else this.heading = "Create a new annotation"

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
        close() {
            this.showModal = false
            tinymce.remove("#annotation-editor")
        },
        save() {
            fetch("http://localhost:3003/annotation.create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${Alpine.store('auth').token}`,
                },
                body: JSON.stringify({
                    context: this.context,
                    text: this.text,
                    body: tinymce.get("annotation-editor").getContent()
                })
            })
            .then(response => {
                this.response = response
                return response.json()
            })
            .then(data => {
                console.log(this.response)
                console.log(data)
            })
        }
    })
})