function noopHandler(evt)
{
	evt.stopPropagation();
	evt.preventDefault();
}

function dropHandler(evt)
{
	evt.stopPropagation();
	evt.preventDefault();

	var files = evt.dataTransfer.files;
	var count = files.length;

	// Only call the handler if 1 or more files was dropped.
	for (var i = 0; i < files.length; ++i)
		handleFile(files[i]);
}

function handleFile(file)
{
	addLocalShareFile(file.name, {
		getData: function(cb) {
			var reader = new FileReader();

			// init the reader event handlers
			reader.onload = function(evt) {
				cb(evt.target.result);
			};

			// begin the read operation
			reader.readAsDataURL(file);
		}
	});
}

document.addEventListener('DOMContentLoaded',function() {
	domelem('dropbox').addEventListener("dragenter", noopHandler, false);
	domelem('dropbox').addEventListener("dragexit", noopHandler, false);
	domelem('dropbox').addEventListener("dragover", noopHandler, false);
	domelem('dropbox').addEventListener("drop", dropHandler, false);
});
