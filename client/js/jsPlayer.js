dbfilename = "database.json"
rootFiletree = new Folder("root");
var global_unique_id = 0;

window.onload = function () {
	musicPathInput = document.getElementById("music_path");
	musicPathInput.addEventListener("input", function(){
		var musicPath = musicPathInput.value;
		musicPath = musicPath.substr(musicPath.length - 1, musicPath.length) == "/" ? musicPath.substr(0, musicPath.length - 1) : musicPath;
		var xhr = new XMLHttpRequest();
		xhr.open("get", musicPath + "/" + dbfilename, true);
		xhr.overrideMimeType("text/html");
		//xhr.setRequestHeader("Content-type", "application/json");
		xhr.onreadystatechange = function() {
			if(xhr.readyState == 4) {
				if(xhr.status == 200) {
					data = JSON.parse(xhr.responseText);
					buildFiletree(data, rootFiletree);
					renderTreeInDiv(document.getElementById("musicChooser"), rootFiletree, 0)
					console.log("finishedBuildingTree");
					allSongDivs = document.querySelectorAll("#musicChooser .file");
					for (var i = 0, len = allSongDivs.length; i < len; i++) {
						allSongDivs[i].addEventListener("click", function(event){ target = event.target });
					}
				}
			};
		};
		xhr.send();
	}, false);
};

function buildFiletree(data, rootTree) {
	for(subName in data) {
		subElementType = data[subName]["/type/"];
		if(subElementType == "folder") {
			folderToAdd = new Folder(subName);
			rootTree.addSubElement(folderToAdd);
			buildFiletree(data[subName], folderToAdd);
		} else if(subElementType == "file") {
			musicFileToAdd = new MusicFile(subName);
			rootTree.addSubElement(musicFileToAdd);
		}
	}
}

function renderTreeInDiv(targetDiv, treeToRender, depth) {
	for(var i = 0; i < treeToRender.subElements.length; i++) {
		subElement = treeToRender.subElements[i];
		if(subElement instanceof Folder) {
			elementToRender = subElement.HTMLElement;
			elementToRender.style.marginLeft = (depth * 50) + "px"
			targetDiv.appendChild(elementToRender);
			renderTreeInDiv(targetDiv, subElement, depth + 1);
		} else if(subElement instanceof MusicFile) {
			elementToRender = subElement.HTMLElement;
			elementToRender.style.marginLeft = (depth * 50) + "px"
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
		for(var i = 0; i < this.subElements.length; i++) {
			isItWanted = this.subElements[i].findElement(unique_id);
			if(isItWanted != false) {
				return this.name + "/" + isItWanted ;
			} else {
				return false;
			};
		}
	}

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
			console.log("file_match")
			return this.name;
		} else {
			console.log("file_nomatch")
			return false;
		}
	}
};
