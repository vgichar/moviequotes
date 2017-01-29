import os
import os.path
import time
import sys
import argparse
import threading
import datetime
import math
import re
import shutil
import json
from slugify import slugify

import scrapy
from scrapy.crawler import CrawlerProcess

class Logr:
	class __Logr:

		lock = threading.Lock()

		def log(self, level, string):
			self.lock.acquire()
			now = datetime.datetime.now()
			print "[%s %s] %s" % (level, now.strftime('%d-%m-%Y %H:%M:%S'), string)
			self.lock.release()

	log = False
	instance = __Logr()

	@staticmethod
	def info(string):
		if Logr.log:
			Logr.instance.log("INFO", string)

	@staticmethod
	def error(string):
		if Logr.log:
			Logr.instance.log("ERROR", string)

class Blockr:
	file_block_folder = "finished/"
	temp_file_block_folder = "unfinished/"
	temp_file_block_movies_pattern = "movies-[block_id].json"
	temp_file_block_series_pattern = "series-[block_id].json"

	block_lock = threading.Lock()
	block_count = 0
	block_next = 0
	blocks = []

	def __init__(self, block_count):
		self.block_count = block_count
		self.blocks = range(block_count)
		self.mkdirs()
		self.detect_finished_blocks()
		self.delete_unfinished_blocks()

	def mkdirs(self):
		if not os.path.exists(self.file_block_folder):
			os.makedirs(self.file_block_folder)

		if not os.path.exists(self.temp_file_block_folder):
			os.makedirs(self.temp_file_block_folder)

		if not os.path.exists("movie-quotes"):
			os.makedirs("movie-quotes")

		if not os.path.exists("serie-quotes"):
			os.makedirs("serie-quotes")

	def detect_finished_blocks(self):
		for (dirpath, dirnames, filenames) in os.walk(self.file_block_folder):
			for filename in filenames:
				block_id = filename.replace("movies-", "").replace("series-", "").replace(".json", "")
				block_id = int(block_id)
				self.blocks[block_id] = None

	def delete_unfinished_blocks(self):
		for (dirpath, dirnames, filenames) in os.walk(self.temp_file_block_folder):
			for filename in filenames:
				os.remove(self.temp_file_block_folder + filename)

	def get_next_block(self):
		block_id = -1
		
		self.block_lock.acquire()
		block_id = None
		while block_id == None:
			if self.block_next < self.block_count:
				block_id = self.blocks[self.block_next]
				Logr.info("Providing block " + `block_id`)
				self.block_next = self.block_next + 1
			else:
				break

		self.block_lock.release()
		if block_id != None:
			self.blocks[block_id] = None

		return block_id

	def finish_block(self, block_id):
		movies_file_name = self.temp_file_block_movies_pattern.replace("[block_id]", `block_id`)
		series_file_name = self.temp_file_block_series_pattern.replace("[block_id]", `block_id`)

		movies_file_exists = os.path.isfile(self.temp_file_block_folder + movies_file_name)
		series_file_exists = os.path.isfile(self.temp_file_block_folder + series_file_name)

		if movies_file_exists:
			os.rename(self.temp_file_block_folder + movies_file_name, self.file_block_folder + movies_file_name)
		if series_file_exists:
			os.rename(self.temp_file_block_folder + series_file_name, self.file_block_folder + series_file_name)

		Logr.info("Moved block " + `block_id`)

	def get_movies_path(self, block_id):
		return self.temp_file_block_folder + self.temp_file_block_movies_pattern.replace("[block_id]", `block_id`)

	def get_series_path(self, block_id):
		return self.temp_file_block_folder + self.temp_file_block_series_pattern.replace("[block_id]", `block_id`)

class Main:
	args_start = 0
	args_end = 10000000
	args_threads_count = 1
	args_block_size = 100
	args_block_count = 100000
	args_log = False

	blockr = None

	def __init__(self, args):
		Logr.log = args.log

		self.args_start = self.args_start if not args.start else args.start 
		self.args_end = self.args_end if not args.end else args.end 
		self.args_block_size = self.args_block_size if not args.block_size else args.block_size
		self.args_block_count = int(math.ceil((self.args_end - self.args_start) / float(self.args_block_size)))
		self.args_threads_count = min(self.diagnose_threads(), self.args_block_count) if not args.threads else min(args.threads, self.args_block_count) 

		self.blockr = Blockr(self.args_block_count)

	def diagnose_threads(self):
		current_milli_time = lambda: int(round(time.time() * 1000))
		times = {};

		global_block_size = self.args_block_size
		global_block_count = self.args_block_count
		global_start = self.args_start
		global_end = self.args_end


		self.args_block_count = 840
		self.args_block_size = 5
		self.args_start = 0
		self.args_end = self.args_block_count * self.args_block_size

		for i in xrange(1, 33):
			self.blockr = Blockr(self.args_block_count)
			self.blockr.file_block_folder = "finished-diagnose/"
			self.blockr.temp_file_block_folder = "unfinished-diagnose/"
			self.blockr.mkdirs()
			self.blockr.detect_finished_blocks()
			self.blockr.delete_unfinished_blocks()

			start_time = current_milli_time()
			self.run_threads(i, self.args_block_size, self.args_start, self.args_end)
			end_time = current_milli_time()

			times[i] = end_time - start_time
			print "Diagnosed: Thread count => Time milliseconds: " + `i` + " => " + `times[i]`
			
			if i - 1 in times and times[i] > times[i - 1]:
				break

			shutil.rmtree(self.blockr.file_block_folder)
			shutil.rmtree(self.blockr.temp_file_block_folder)

		self.args_start = global_start
		self.args_end = global_end
		self.args_block_size = global_block_size
		self.args_block_count = global_block_count

		best_threads_count = 0
		min_thread_time = sys.maxint
		for key in times:
			if(times[key] + 1000 < min_thread_time):
				min_thread_time = times[key]
				best_threads_count = key

		print "Diagnosed: Best thread count is " + `best_threads_count`
		return best_threads_count;

	def run(self):
		Logr.info("Threads count: " + `self.args_threads_count`)
		Logr.info("Block size: " + `self.args_block_size`)

		self.run_threads(self.args_threads_count, self.args_block_size, self.args_start, self.args_end)

	def run_threads(self, threads_count, block_size, start, end):
		try:
			threads_array = [];
			for thread_order in range(threads_count):
				t = threading.Thread(target=self.run_thread, args=(block_size, start, end) )
				threads_array.append(t)
			for thr in threads_array:
				thr.start()
			for thr in threads_array:
				thr.join()
		except:
			print "Cannot start threads"
		Logr.info("Done running threads")

	def run_thread(self, block_size, start, end):
		while 1:
			block_id = self.blockr.get_next_block()

			if block_id == None:
				Logr.info("No new block")
				break

			movies_file = self.blockr.get_movies_path(block_id)
			series_file = self.blockr.get_series_path(block_id)

			Logr.info("Working on block " + `block_id`)

			for i in xrange(start + (block_size * block_id), min(start + (block_size * (block_id + 1)), end)):
				self.run_scraper(i, movies_file, series_file)

			self.blockr.finish_block(block_id)
		Logr.info("Thread done")

	def run_scraper(self, movie_id, movies_file, series_file):
		os.system('scrapy runspider spider.py --loglevel ERROR -a movie_id=' + `movie_id` + " -a movies_file=" + movies_file + " -a series_file=" + series_file)


parser = argparse.ArgumentParser()

parser.add_argument('-s', '--start', type=int)
parser.add_argument('-e', '--end', type=int)
parser.add_argument('-t', '--threads', type=int)
parser.add_argument('-b', '--block-size', type=int)
parser.add_argument('-l', '--log', action='store_true')

args = parser.parse_args()

main = Main(args)
main.run()