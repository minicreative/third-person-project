let API_BASE = "https://api.thirdpersonproject.org/"
if (location.href.includes("localhost")) {
	API_BASE = "http://localhost:3003/"
}

// On Page Load
$(document).ready(function() {
	setupTabs()
	setupMobileNav()
    setupSlider()
    setColumnWidth()
})

// On Stricter Page Load
$(window).on('load', function () {
	setupBricks()
})

// On Page Resize
$(window).resize(function () {
	setColumnWidth()
})

// On Scroll
$(window).on('scroll', function() {
	handleStickyNav()
})

let stickyToolbarPosition
function handleStickyNav() {

	// Initialize toolbar
	let stickyToolbar = $(".annotation-toolbar").first()

	// Exit function if toolbar not found
	if (stickyToolbar === undefined || stickyToolbar.length < 1) return

	// Exit function if transcript <detail> is not open
	let detail = stickyToolbar.parents().find("details").first()
	if (detail.attr("open") === undefined) {
		return
	}

	// Save initial (un-stuck) position of toolbar once transcript detail is open
	if (!stickyToolbarPosition) stickyToolbarPosition = stickyToolbar.position()

	// Add or remove sticky class based on scroll
	if ($(window).scrollTop() >= stickyToolbarPosition.top) {
		stickyToolbar.addClass("sticky")
	} else {
		stickyToolbar.removeClass("sticky")
	}
}

function setupTabs() {
	$(".tab-container").each(function () {
		let container = $(this)
		let tab_button_list = container.find(".tabs").first()
		let tab_areas = container.find(".tab")

		// Setup click events
		tab_button_list.find("div").each(function () {
			$(this).on('click', function () {
				const name = $(this).attr("name")
				
				// Iterate through tab buttons
				tab_button_list.find("div").each(function () {
					let button = $(this)
					if (button.attr('name') === name) button.addClass("active")
					else button.removeClass("active")
				})

				// Iterate through tabs
				tab_areas.each(function () {
					let tab_area = $(this)
					if (tab_area.attr('id') === name) tab_area.addClass("active")
					else tab_area.removeClass("active")
				})
			})
		})

	})
}

function setupSlider() {
    if ($(".slider").length > 0) {
        $(".slider").royalSlider({
            imageScaleMode: 'fill',
            transitionType: 'fade',
            transitionSpeed: 1200,
            sliderDrag: false,
            navigateByClick: false,
            autoplay: {
                enabled: true,
                pauseOnHover: false,
                delay: 4000
            }
        })
    }
}

function setupMobileNav() {
	let navigation = $(".navigation");
	let navUnderlay = $("#nav-underlay");
	$("#nav-toggle").click(function () {
		if (navigation) navigation.toggleClass("show");
		if (navUnderlay) navUnderlay.toggleClass("show");
	});
	navUnderlay.click(function () {
		navigation.toggleClass("show");
		navUnderlay.toggleClass("show");
	});
}

function setColumnWidth() {
	$(".columns").each(function () {

		// Get container
		let columns = $(this);

		// Get window width
		let windowWidth = $(window).width();

		// Make mobile & table flags
		let isMobile = (windowWidth < 760);
		let isTablet = (windowWidth < 1020);

		// Handle each column
		columns.find(".column").each(function () {

			// Get column
			let column = $(this);

			// Reset existing inline margin
			column.css("marginRight", "");

			// Override on mobile
			if (isMobile) {
				column.css("width", "100%");
				column.css("marginRight", 0);
				return;
			}
	
			// Get and format margin for math
			let margin = parseInt(column.css("marginRight").replace('px',''));

			// Setup main/side cols
			if (column.hasClass("main")) {
				column.css("width", ((columns.width()-(margin))*0.69));
				if ((((column.index()+1) % 2) == 0)) {
					column.css("marginRight", 0);
				}
			}
			else if (column.hasClass("side")) {
				column.css("width", ((columns.width()-(margin))*0.3));
				if ((((column.index()+1) % 2) == 0)) {
					column.css("marginRight", 0);
				}
			}
	
			// Set columns to half width
			else if (column.hasClass("half") || (column.hasClass("third") && isTablet)) {
				column.css("width", ((columns.width()-margin)/2)-3);
				if ((((column.index()+1) % 2) == 0)) {
					column.css("marginRight", 0);
				}
			}

			// Set columns to third width
			else if (column.hasClass("third") || column.hasClass("tabletThird")) {
				column.css("width", ((columns.width()-(margin*2))/3));
				if ((((column.index()+1) % 3) == 0)) {
					column.css("marginRight", 0);
				}
			}

			// Set columns to fourth width
			else if (column.hasClass("fourth")) {
				column.css("width", ((columns.width()-(margin*3))/4));
				if ((((column.index()+1) % 4) == 0)) {
					column.css("marginRight", 0);
				}
			}
				
		})
	})
}

let bricks;
function setupBricks() {

	// Only setup if Bricks included
	if (!window.Bricks) return;

	// Only setup if bricks area found
	let hasBricks = false;
	let firstColumn;
	$(".columns").each(function () {
		if ($(this).hasClass("bricks")) {
			hasBricks = true;
			firstColumn = $(this).find(".column").first();
		}
	})
	if (!hasBricks) return;

	// Detect column width
	let numColumns = 1;
	if (firstColumn.hasClass('fourth'))
		numColumns = 4;
	else if (firstColumn.hasClass('third') || firstColumn.hasClass('tabletThird'))
		numColumns = 3;
	else if (firstColumn.hasClass('half'))
		numColumns = 2;

	// Setup sizing
	let size = {
		columns: numColumns,
		gutter: parseInt(firstColumn.css("marginRight").replace('px', ''))
	};
	let windowWidth = $(window).width();
	if (windowWidth < 760) {
		size.columns = 1;
		size.gutter = 20;
	} else if (windowWidth < 1020) {
		size.columns = 2;
	}

	// Setup bricks
	bricks = Bricks({
		container: '.columns',
		packed: 'data-packed',
		sizes: [
			size
		],
		position:true,
	});
	bricks.pack();
}