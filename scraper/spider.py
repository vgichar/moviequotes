import scrapy
import re
import json
import traceback
from slugify import slugify

class ImdbSpider(scrapy.Spider):
	name = 'imdb'

	def __init__(self, movie_id = 0, movies_file = 'movies.json', series_file = 'series.json'):
		self.movies_file = movies_file
		self.series_file = series_file
		self.movie_id = int(movie_id)
		self.start_urls = ['http://www.imdb.com/title/tt' + `self.movie_id` + '/quotes']

	def parse(self, response):
		try:
			movie_id = self.movie_id
			quotes = [];
			for quote in response.css(".sodatext"):
				lines = []
				for line in quote.css("p"):
					line_texts = line.css('::text').extract()
					line_text = u''.join(line_texts)
					line_text = line_text.split(':')[-1].strip(" \n\t\r")
					char_id = line.css('a ::attr(href)').extract_first()

					if char_id:
						char_id = char_id.replace('/name/', '').replace('/?ref_=tt_trv_qu', '')
					lines.append({
						'characterId': char_id,
						'character': line.css('a > span.character ::text').extract_first(),
						'text': line_text
					})
				quotes.append({
					'lines': lines
				})

			if len(quotes) > 0:
				title_block = response.css(".subpage_title_block");

				movie_title = title_block.css('.parent a ::text').extract_first()
				movie_year = re.findall("(\\d{4})", title_block.css('.parent h3 span ::text').extract_first())[0]
				movie_img = title_block.css('img ::attr(src)').extract_first()
				movie_slug = slugify(movie_title + " " + movie_year)
				is_series = title_block.css('.parent h4 span ::text').extract_first() == '(TV Series)'

				if is_series:
					with open("serie-quotes/" + movie_slug + ".json", 'wb') as f:
						f.write(json.dumps({
							'quotes': quotes
						}))
						
					with open(self.series_file, 'a') as f:
						f.write(json.dumps({
							'id': movie_id,
							'title': movie_title,
							'year': movie_year,
							'img': movie_img
						}))
						f.write(",\n")
				else:
					with open("movie-quotes/" + movie_slug + ".json", 'wb') as f:
						f.write(json.dumps({
							'quotes': quotes
						}))

					with open(self.movies_file, 'a') as f:
						f.write(json.dumps({
							'id': movie_id,
							'title': movie_title,
							'year': movie_year,
							'img': movie_img
						}))
						f.write(",\n")
			else:
				with open(self.series_file, 'a') as f:	
					f.write("")
				with open(self.movies_file, 'a') as f:
					f.write("")
		except:
			with open("errors.txt", 'a+') as f:
				f.write("Movie ID " + `movie_id` + "\n")
				f.write(traceback.format_exc())
				f.write("=============================================================================\n")
			with open("errors-movies.txt", 'a+') as f:
				f.write(`movie_id` + "\n")
				f.write("=============================================================================\n")
