dbfilename = "database.json"
rootFiletree = new Folder(" ");
jsPlayer = new JsPlayer();
var global_unique_id = 0;

window.onload = function () {
	musicPathInput = document.getElementById("musicPath");
	musicPathInput.addEventListener("input", function(){
		var musicPath = musicPathInput.value;
		musicPath = musicPath.substr(musicPath.length - 1, musicPath.length) == "/" ? musicPath.substr(0, musicPath.length - 1) : musicPath;
		musicPath = musicPath + "/" + dbfilename;
		var xhr = new XMLHttpRequest();
		xhr.open("get", musicPath, true);
		xhr.overrideMimeType("text/html");
		xhr.onreadystatechange = function() {
			if(xhr.readyState == 4) {
				if(xhr.status == 200) {
					data = JSON.parse(xhr.responseText);
					buildFiletree(data, rootFiletree);
					renderTreeInDiv(document.getElementById("musicChooser"), rootFiletree, 0)
					allSongDivs = document.querySelectorAll("#musicChooser .file");
					for (var i = 0, len = allSongDivs.length; i < len; i++) {
						allSongDivs[i].addEventListener("click", onMusicClickListener);
					};
				};
			};
		};
		xhr.send();
	}, false);

	pauseBtn = document.querySelector("#pause.button");
	nextBtn = document.querySelector("#next.button");
	prevBtn = document.querySelector("#prev.button");

	pauseBtn.addEventListener("click", function() { jsPlayer.pause(); });
	nextBtn.addEventListener("click", function() { jsPlayer.playlist.next(); });
	prevBtn.addEventListener("click", function() { jsPlayer.playlist.prev(); });

};

function onMusicClickListener(e) {
	targetId = e.target.getAttribute("unique_id");
	pathToPlay = rootFiletree.findElement(targetId);
	jsPlayer.playlist.add(pathToPlay);
};

function buildFiletree(data, rootTree) {
	for(subName in data) {
		subElementType = data[subName]["/type/"];
		if(subElementType == "folder") {
			folderToAdd = new Folder(subName);
			rootTree.addSubElement(folderToAdd);
			buildFiletree(data[subName], folderToAdd);
		} else if(subElementType == "file") {
			musicFileToAdd = new MusicFile(subName, data[subName]["album"], data[subName]["artist"], data[subName]["title"], data[subName]["art"]);
			rootTree.addSubElement(musicFileToAdd);
		}
	}
}

function renderTreeInDiv(targetDiv, treeToRender, depth) {
	for(var i = 0; i < treeToRender.subElements.length; i++) {
		subElement = treeToRender.subElements[i];
		if(subElement instanceof Folder) {
			elementToRender = subElement.HTMLElement;
			elementToRender.style.marginLeft = (depth * 10) + "px"
			targetDiv.appendChild(elementToRender);
			renderTreeInDiv(targetDiv, subElement, depth + 1);
		} else if(subElement instanceof MusicFile) {
			elementToRender = subElement.HTMLElement;
			elementToRender.style.marginLeft = (depth * 10) + "px"
			targetDiv.appendChild(elementToRender);
		} else {
			;
		}
	}
};

function Folder(name) {
	global_unique_id += 1;
	this.unique_id = global_unique_id;
	this.HTMLElement = document.createElement("div");
	this.name = name;
	this.subElements = [];

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
	this.HTMLElement.innerHTML = this.name

	this.HTMLElement.setAttribute("unique_id", this.unique_id)

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
	this.currentSongIndex = -1;
	this.songs = [];
	this.onsongchange = function() {};
	this.onsongadd = function() {};

	this.next = function() {
		if(this.currentSongIndex + 1 < this.songs.length) {
			this.currentSongIndex += 1;
			this.onsongchange(this.songs[this.currentSongIndex]);
			this.audioElement.src = this.songs[this.currentSongIndex].getPath();
			this.audioElement.play();
		};
	};

	this.prev = function() {
		if(this.currentSongIndex - 1 >= 0) {
			this.onsongchange(this.songs[this.currentSongIndex]);
			this.currentSongIndex -= 1;
			this.audioElement.src = this.songs[this.currentSongIndex].getPath();
			this.audioElement.play();
		};
	};

	this.add = function(songFile, position) {
		this.onsongadd(songFile);
		var position = position == undefined ? this.songs.length : position;
		this.songs.splice(position, 0, songFile);
	};

	this.findPosition = function(songFile) {
		for(var i = 0; i < this.songs.length; i++) {
			if(this.songs[i] == songFile) {
				return i;
			}
		};
		return -1;
	};
};

function JsPlayer() {
	this.audio = new Audio();
	this.audio.playlist = new Playlist(this.audio);
	this.audio.playlist.onsongadd = songadd;
	this.audio.playlist.onsongchange = songchange;

	this.audio.addEventListener("ended", function() {
		this.playlist.next();
	});

	return this.audio;
};

function songchange(audioFile) {
	htmlPlaylist = document.querySelector("div#playlist");
};

function songadd(audioFile) {
	htmlPlaylist = document.querySelector("div#playlist");
	htmlElement = document.createElement("div");
	htmlElement.innerHTML = jsPlayer.playlist.findPosition(audioFile) + audioFile.name
}

