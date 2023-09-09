
$("#transcript").ready(function() {
    listAnnotations()
})

function listAnnotations() {
    fetchAPI({
        path: "annotation.list",
        body: {
            context: $("#page-slug").text()
        },
        success: ({ annotations }) => {
            addAnnotationsToTranscript(annotations)
        },
        failure: (data) => {
            Alpine.store('error').post(data.message)
        }
    })
}

function addAnnotationsToTranscript(annotations) {
    // Initialize jQuery elements
    const transcript = $("#transcript")
    let transcriptContent = transcript.html()

    // Iterate through annotations, add markup
    for (let annotation of annotations) {
        let annotatedHtml = `<span guid='${annotation.guid}'>${annotation.text}</span>`
        transcriptContent = transcriptContent.replaceAll(annotation.text, annotatedHtml)
    }

    // Update transcript with annotated HTML
    transcript.html(transcriptContent)

    // Add listeners
    addAnnotationListeners()
}

function addAnnotationListeners() {
    const transcript = $("#transcript")
    const annotations = transcript.find("span")
    annotations.each(function() {
        $(this).on('click', function () {
            Alpine.store('annotation').openViewer({
                text: $(this).text(),
                guid: $(this).attr("guid")
            })
        })
    })
}