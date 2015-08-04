dbfilename = "database.json";
jsPlayer = new JsPlayer();
var global_unique_id = 0;

window.onload = function () {
	if(localStorage.getItem("musicPath")) {
		initCheckFolder();
	};

	checkBtn = document.getElementById("checkFolderButton");
	checkBtn.addEventListener("click", function() {
		initCheckFolder();
	});

	rememberPath = document.getElementById("rememberPath");
	rememberPath.addEventListener("change", function() {
		if(rememberPath.checked) {
			musicPathInput = document.getElementById("musicPath");
			musicPathInput.addEventListener("change", function() {
				persistPath();
			});
			persistPath();
		} else {
			localStorage.removeItem("musicPath");
		};
	});

	toggleBtn = document.querySelector("#toggle.button");
	nextBtn = document.querySelector("#next.button");
	prevBtn = document.querySelector("#prev.button");
	progressBarContainer = document.querySelector("#progressbarContainer");
	progressBar = document.querySelector("#progressBar");

	progressBarContainer.onclick = function(e) {
		var winWidth = document.getElementsByTagName("body")[0].clientWidth
		jsPlayer.currentTime = (jsPlayer.duration / winWidth) * e.layerX;
	};

	toggleBtn.addEventListener("click", function() { jsPlayer.toggle(); });
	nextBtn.addEventListener("click", function() { jsPlayer.playlist.next(); });
	prevBtn.addEventListener("click", function() { jsPlayer.playlist.prev(); });

};

function persistPath() {
	var musicPathInput = document.getElementById("musicPath");
	var musicPath = musicPathInput.value;
	musicPath = musicPath.substr(musicPath.length - 1, musicPath.length) == "/" ? musicPath.substr(0, musicPath.length - 1) : musicPath;
	localStorage.setItem("musicPath", musicPath);
};

function initCheckFolder() {
	musicPathInput = document.getElementById("musicPath");

	if(!localStorage.getItem("musicPath")) {
		var musicPath = musicPathInput.value;
		musicPath = musicPath.substr(musicPath.length - 1, musicPath.length) == "/" ? musicPath.substr(0, musicPath.length - 1) : musicPath;
	} else {
		musicPath = localStorage.getItem("musicPath");
	};
	musicDbPath = musicPath + "/" + dbfilename;
	var xhr = new XMLHttpRequest();
	xhr.open("get", musicDbPath, true);
	xhr.overrideMimeType("text/html");
	xhr.onreadystatechange = function() {
		if(xhr.readyState == 4) {
			if(xhr.status == 200) {
				data = JSON.parse(xhr.responseText);
				rootFiletree = buildFiletree(data, musicPath);
				renderTreeInDiv(document.getElementById("musicChooser"), rootFiletree, 0)
				allSongDivs = document.querySelectorAll("#musicChooser .file");
				for (var i = 0, len = allSongDivs.length; i < len; i++) {
					allSongDivs[i].addEventListener("click", onMusicClickListener);
				};
				hideMusicSelectionDialog();
			};
		};
	};
	xhr.send();
};

function onMusicClickListener(e) {
	t = e.target;
	do {
		targetId = t.getAttribute("unique_id");
		t = t.parentNode;
	} while(t && !targetId);

	pathToPlay = rootFiletree.findElement(targetId);
	jsPlayer.playlist.add(pathToPlay);
};

function onPlaylistClickListener(e) {
	t = e.target;
	do {
		targetId = t.getAttribute("unique_id");
		t = t.parentNode;
	} while(t && !targetId);

	jsPlayer.playlist.play(targetId);
};

function buildFiletree(data, rootTree) {
	if(!(rootTree instanceof Folder)){
		rootTree = new Folder(rootTree, true);
	};

	for(subName in data) {
		subElementType = data[subName]["/type/"];
		if(subElementType == "folder") {
			folderToAdd = new Folder(subName);
			rootTree.addSubElement(folderToAdd);
			buildFiletree(data[subName], folderToAdd);
		} else if(subElementType == "file") {
			musicFileToAdd = new MusicFile(subName, data[subName]["album"], data[subName]["artist"], data[subName]["title"], data[subName]["image"]);
			rootTree.addSubElement(musicFileToAdd);
		}
	}

	return rootTree;
}

function renderTreeInDiv(targetDiv, treeToRender, depth) {
	if(treeToRender.isRoot){
		mainFolder = treeToRender.HTMLElement;
		targetDiv.appendChild(mainFolder);
		depth += 1;
		targetDiv = mainFolder;
	}

	for(var i = 0; i < treeToRender.subElements.length; i++) {
		subElement = treeToRender.subElements[i];
		if(subElement instanceof Folder) {
			elementToRender = subElement.HTMLElement;
			targetDiv.appendChild(elementToRender);
			renderTreeInDiv(elementToRender, subElement, depth + 1);
		} else if(subElement instanceof MusicFile) {
			elementToRender = subElement.HTMLElement;
			targetDiv.appendChild(elementToRender);
		} else {
			;
		}
	}
};

function Folder(name, isRoot) {
	global_unique_id += 1;
	this.unique_id = global_unique_id;
	this.HTMLElement = document.createElement("div");
	this.name = name;
	this.subElements = [];
	this.isRoot = isRoot || false;

	this.addSubElement = function(element) {
		this.subElements.push(element);
	}

	this.findElement = function(unique_id) {
		if(this.unique_id == unique_id) {
			return this;
		} else {
			for(var i = 0; i < this.subElements.length; i++) {
				isItWanted = this.subElements[i].findElement(unique_id);
				if(isItWanted != undefined) {
					return isItWanted;
				};
			}
			return undefined;
		}
	}

	this.findPath = function(unique_id) {
		if(this.unique_id == unique_id) {
			return this.name;
		} else {
			for(var i = 0; i < this.subElements.length; i++) {
				isItWanted = this.subElements[i].findPath(unique_id);
				if(isItWanted != undefined) {
					return this.name + "/" + isItWanted;
				};
			}
			return undefined;
		}
	}

	this.getPath = function() {
		return rootFiletree.findPath(this.unique_id);
	};

	this.HTMLElement.classList.add(this.name.replace(/\s/g, "_"));
	this.HTMLElement.classList.add("folder");
	this.HTMLElement.innerHTML = this.name;
	this.HTMLElement.setAttribute("draggable", "true");

	this.HTMLElement.setAttribute("unique_id", this.unique_id)
}

function MusicFile(name, artist, album, title, art) {
	global_unique_id += 1;
	this.unique_id = global_unique_id;
	this.HTMLElement = document.createElement("div");
	this.name = name;
	this.artist = artist;
	this.album = album;
	this.title = title;
	this.art = art;

	this.HTMLElement.classList.add(this.name.replace(/\s/g, "_"));
	this.HTMLElement.classList.add("file");

	this.artTag = '<span class="album_art">';
	if(art) {
		this.artTag += '<img src="data:image/jpeg;base64,' + art + '" alt="Album art">';
	}
	this.artTag += '</span>';

	this.HTMLElement.innerHTML = this.artTag + '<span class="library_name">' + this.name + '</span>';

	this.HTMLElement.setAttribute("unique_id", this.unique_id);
	this.HTMLElement.setAttribute("draggable", "true");

	this.findElement = function(unique_id) {
		if(this.unique_id == unique_id) {
			return this;
		} else {
			return undefined;
		};
	};

	this.findPath = function(unique_id) {
		if(this.unique_id == unique_id) {
			return this.name;
		} else {
			return undefined;
		};
	};

	this.getPath = function() {
		return rootFiletree.findPath(this.unique_id);
	};
};

function Playlist(audioElement) {
	this.audioElement = audioElement;
	this.currentElementIndex = -1;
	this.elements = [];
	this.onsongchange = function() {};
	this.onsongadd = function() {};

	this.next = function() {
		if(this.currentElementIndex + 1 < this.elements.length) {
			this.currentElementIndex += 1;
			this.onsongchange(this.elements[this.currentElementIndex]);
			this.audioElement.src = this.elements[this.currentElementIndex].musicFile.getPath();
			this.audioElement.play();
		};
	};

	this.prev = function() {
		if(this.currentElementIndex - 1 >= 0) {
			this.onsongchange(this.elements[this.currentElementIndex]);
			this.currentElementIndex -= 1;
			this.audioElement.src = this.elements[this.currentElementIndex].musicFile.getPath();
			this.audioElement.play();
		};
	};

	this.play = function(elementNr) {
		if(elementNr >= 0 && elementNr < this.elements.length) {
			this.currentElementIndex = elementNr;
			this.onsongchange(this.elements[this.currentElementIndex]);
			this.audioElement.src = this.elements[this.currentElementIndex].musicFile.getPath();
			this.audioElement.play();
		};
	};

	this.add = function(songFile, position) {
		var playlistElement = new PlaylistElement(songFile);
		var position = position == undefined ? this.elements.length : position;
		this.elements.splice(position, 0, playlistElement);
		this.updateAllElementIndex();
		this.onsongadd(playlistElement);
		if(this.elements.length==1) {
			this.play(0);
		};
	};

	this.updateAllElementIndex = function() {
		for(var i = 0; i < this.elements.length; i++) {
			this.elements[i].playlistPosition = i;
		};
	};
};

function PlaylistElement(musicFile) {
	this.HTMLElement = document.createElement("div");
	this.playlistPosition = -1;
	this.musicFile = musicFile;
};

function JsPlayer() {
	this.audio = new Audio();
	this.audio.playlist = new Playlist(this.audio);
	this.audio.playlist.onsongadd = songadd;
	this.audio.playlist.onsongchange = songchange;

	this.audio.addEventListener("ended", function() {
		this.playlist.next();
	});

	this.audio.addEventListener("timeupdate", function() {
		progressbar = document.querySelector("div#progressbar");
		progressbar.style.width = (this.currentTime / this.duration * 100) + "%";
	});

	this.audio.addEventListener("play", function() {
		toggleBtn.classList.add("pause")
		toggleBtn.classList.remove("play")
	});

	this.audio.addEventListener("pause", function() {
		toggleBtn.classList.add("play")
		toggleBtn.classList.remove("pause")
	});

	this.audio.toggle = function() {
		if(this.playlist.elements.length > 0) {
			if(this.paused) {
				this.play();
			} else {
				this.pause();
			};
		};
	};

	return this.audio;
};

function songchange(audioFile) {
	htmlPlaylist = document.querySelector("div#playlist");
};

function songadd(playlistElement) {
	htmlPlaylist = document.querySelector("div#playlist");
	htmlElement = document.createElement("div");
	htmlElement.setAttribute("draggable", "true");
	htmlElement.setAttribute("unique_id", playlistElement.playlistPosition); // FIXME: use hashcode when implementing Drag&Drop
	htmlElement.innerHTML = "<pre class=\"playlistPosition\">" + (playlistElement.playlistPosition + 1) + "   </pre>" + playlistElement.musicFile.name;
	htmlElement.addEventListener("click", onPlaylistClickListener);
	htmlPlaylist.appendChild(htmlElement);
}

function hideMusicSelectionDialog() {
	overlay = document.getElementById("pathSelectionOverlay");
	overlay.style.display = "none";
	document.getElementById("controls").classList.remove("blured");
}
