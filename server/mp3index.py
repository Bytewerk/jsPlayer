#!/usr/bin/env python3
# coding: utf-8
# vim: noexpandtab sw=2 ts=2 sts=2

import os
import sys
import json
import codecs
import base64
import mutagen

from PIL import Image
from io import BytesIO
from mutagen.mp3 import MP3

THUMBSIZE = (64, 64)
OUTPUT = "database.json"
FOLDER = "."

if len(sys.argv) > 1:
	FOLDER = sys.argv[1]

def encode_image(data):
	# load the image
	im = Image.open(BytesIO(data))
	im.thumbnail(THUMBSIZE, Image.ANTIALIAS)

	output = BytesIO()
	im.save(output, format='JPEG')
	imgdata = output.getvalue()
	output.close()

	return base64.b64encode(imgdata).decode()

mp3db = {}

for root, dirs, files in os.walk(FOLDER):
	rootparts = root.split(os.path.sep)

	dirobj = mp3db
	for p in rootparts:
		if not p:
			continue

		if p not in dirobj:
			dirobj[p] = {"/type/": "folder"}

		dirobj = dirobj[p]

	for f in files:
		if f.endswith(".mp3"):
			filename = os.path.join(root, f)

			print("Scanning {} ...".format(filename))

			mp3info = {"/type/": "file"}

			try: # to parse the file
				audio = MP3(filename)

				mp3info['length'] = int(audio.info.length)
				mp3info['bitrate'] = int(audio.info.bitrate)

				if not audio.tags:
					print("No tags found.")
				else:
					if 'TIT2' in audio.tags:
						#mp3info['title'] = codecs.decode(audio.tags['TIT2'].text[0], 'utf-8', 'replace')
						mp3info['title'] = audio.tags['TIT2'].text[0]
					if 'TALB' in audio.tags:
						mp3info['album'] = audio.tags['TALB'].text[0]
					if 'TPE1' in audio.tags:
						mp3info['artist'] = audio.tags['TPE1'].text[0]

					if 'APIC:' in audio.tags:
						print("Image data found.")
						d = audio.tags['APIC:'].data
						mp3info['image'] = encode_image(d)
			except mutagen.mp3.HeaderNotFoundError as e:
				print("FAILED >> {}".format(e))

			dirobj[f] = mp3info

with open(OUTPUT, 'w') as outfile:
	outfile.write(json.dumps(mp3db))
