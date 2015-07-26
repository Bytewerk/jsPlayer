#!/usr/bin/env python2
# coding: utf-8
# vim: noexpandtab sw=2 ts=2 sts=2

import os
import sys
import pyid3lib
import json
import codecs
import base64

from PIL import Image
from StringIO import StringIO

THUMBSIZE = (64, 64)
OUTPUT = "database.json"
FOLDER = "."

if len(sys.argv) > 1:
	FOLDER = sys.argv[1]

def encode_image(obj):
	mimetype = obj['mimetype']
	data = obj['data']

	# load the image
	im = Image.open(StringIO(data))
	im.thumbnail(THUMBSIZE, Image.ANTIALIAS)

	output = StringIO()
	im.save(output, format='JPEG')
	imgdata = output.getvalue()
	output.close()

	return base64.b64encode(imgdata)

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

			id3tags = pyid3lib.tag(filename)

			mp3info = {"/type/": "file"}
			if 'TPE1' in id3tags:
				mp3info['artist'] = codecs.decode(id3tags.artist, 'utf-8', 'replace')
			if 'TIT2' in id3tags:
				mp3info['title'] = codecs.decode(id3tags.title, 'utf-8', 'replace')
			if 'TALB' in id3tags:
				mp3info['album'] = codecs.decode(id3tags.album, 'utf-8', 'replace')
			if 'APIC' in id3tags:
				print("Image data found.")
				d = id3tags[id3tags.index('APIC')]
				mp3info['image'] = encode_image(d)

			dirobj[f] = mp3info

with open(OUTPUT, 'w') as outfile:
	outfile.write(json.dumps(mp3db, indent=2))
