import os
import json
import datetime
from slugify import slugify

def consolidate_files(filename_contains, output_file):
	obj = ""
	for (dirpath, dirnames, filenames) in os.walk("finished"):
		for filename in filenames:
			with open("finished/" + filename, "r") as file:
				if filename_contains in filename:
					obj += file.read()

	obj = "[" + obj.strip('\n,') + "]";
	content = json.loads(obj)

	slug_map = {};
	for json_obj in content:
		slug = slugify(json_obj['title'] + " " + json_obj['year'])
		slug_map[slug] = json_obj

	distinct_content = [];
	for slug in slug_map:
		distinct_content.append(slug_map[slug])

	with open(output_file, "w+") as file:
		file.write(json.dumps(distinct_content))

	return distinct_content

def data_to_sitemap_urls(data, entry_type):
	xml = ""
	for row in data:
		slug = slugify(row['title'] + " " + row['year'])
		xml += slug_to_sitemap_entry(slug, entry_type)

	return xml

def slug_to_sitemap_entry(slug, entry_type):
	today = datetime.date.today()
	formatedDate = today.strftime("%Y-%m-%d")
	return """<url>
	<loc>http://moviequotes.netlify.com/#!/""" + entry_type + "-details/" + slug + """</loc>
	<lastmod>""" + formatedDate + """</lastmod>
	<changefreq>monthly</changefreq>
	<priority>0.8</priority>
</url>\n"""

movies = consolidate_files("movie", "movies.json")
series = consolidate_files("serie", "series.json")

xml = """<?xml version="1.0" encoding="UTF-8"?>
			<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">""";

xml += data_to_sitemap_urls(movies, "movie")
xml += data_to_sitemap_urls(series, "serie")
xml += "</urlset>"

with open("sitemap.xml", "w+") as file:
	file.write(xml)