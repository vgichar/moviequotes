/// <reference path="../_references.ts" />

module DB{
	class QuoteModel extends BaseModel{
		public constructor(id, lines: string[], movieSlug){
			super(id++);
			this.lines = lines;
			this.movieSlug = movieSlug;
		}

		public lines: string[];
		public movieSlug: string;
	}

	export class QuotesDB extends BaseDB<QuoteModel>{
		public constructor(){
			super("");
		}

		public get (id, movieSlug): QuoteModel {
			id = parseInt(id.toString());
			return this.getByMovie(movieSlug).Single(x => x.id == id);
		}

		public getByMovie (movieSlug): linq.Enumerable<QuoteModel> {
			let movieQuotesObj: any = Library.Filer.Current().getFile("json/movie-quotes/" + movieSlug + ".json");
			let movieQuotes: any[] = movieQuotesObj.quotes;
			let idx = 0;
			return Enumerable.From(movieQuotes).Select(x => new QuoteModel(idx, x.lines, movieSlug));
		}

		public getByMovies (movieSlugs: string[]): linq.Enumerable<QuoteModel> {
			let files = Enumerable.From(movieSlugs).Select(x => "json/movie-quotes/" + x + ".json").ToArray();
			
			let quotes: QuoteModel[] = [];
			for(let i in movieSlugs){
				let byMovie = this.getByMovie(movieSlugs[i]);
				quotes.push(byMovie.First());
			}

			return Enumerable.From(quotes);
		}

		public getPopularMovieQuotes (): linq.Enumerable<QuoteModel> {
			let content: any = this.getPopularContent();
			let quotes: any[] = content['popular-movie-quotes'];
			let id = 0;
			return Enumerable.From(quotes).Select(x => new QuoteModel(id, x.lines, x.movieSlug));
		}

		public getQuoteOfTheDay (): QuoteModel {
			let content: any = this.getPopularContent();
			let quote = content['quote-of-the-day'];
			return new QuoteModel(quote.id, quote.lines, quote.slug);
		}

		public getRandomQuote (notIn: string[] = []): QuoteModel {
			let moviesDB = new MoviesDB();
			let movie = moviesDB.getRandomMovie();
			if(movie == undefined || notIn[movie.slug] == true)
				return undefined;

			let quotes = this.getByMovie(movie.slug);
			let quoteIds = Library.Utils.initArrayOrdered(quotes.Count());
			let notSeen = Enumerable.From(quoteIds).Except(notIn).ToArray();			
			
			let hash = Library.Utils.hashCode(Library.Utils.now()) % notSeen.length;

			return quotes[notSeen[hash]];
		}
	}
}