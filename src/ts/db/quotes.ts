/// <reference path="../_references.ts" />

module DB{
	class Quote{
		public constructor(id, lines: string[], movieSlug){
			this.id = id++;
			this.lines = lines;
			this.movieSlug = movieSlug;
		}

		public id: number;
		public lines: string[];
		public movieSlug: number;
	}

	export class QuotesDB{
		public static get = (id, movieSlug): Quote => {
			id = parseInt(id.toString());
			return QuotesDB.getByMovie(movieSlug).Single(x => x.id == id);
		}

		public static getByMovie = (movieSlug): any => {
			let movieQuotesObj: any = Library.Filer.Current().getFile("json/quotes/" + movieSlug + ".json");
			let movieQuotes: any[] = movieQuotesObj.quotes;
			let idx = 0;
			return Enumerable.From(movieQuotes).Select(x => new Quote(idx, x.lines, movieSlug));
		}

		public static getQuoteOfTheDay = (): Quote => {
			let movieOfTheDay = MoviesDB.getMovieOfTheDay();
			let quotes: Quote[] = QuotesDB.getByMovie(movieOfTheDay.slug).ToArray();

			let previous = LocalStorageQuotes.getPreviousQuotes();
			let current = LocalStorageQuotes.getCurrentQuote();

			if(!current){
				let hash = Library.Utils.hashCode(Library.Utils.now()) % quotes.length;
				LocalStorageQuotes.setCurrentQuote(hash, Library.Utils.today(), Library.Utils.today(1));
				return quotes[hash];
			}

			if(current.dateFrom <= Library.Utils.now() && current.dateTo >= Library.Utils.now()){
				let hash = Library.Utils.hashCode(Library.Utils.now()) % quotes.length;
				return quotes[hash];
			}else{
				LocalStorageQuotes.addPreviousQuote(current.id, current.dateFrom, current.dateTo);

				if(previous.length == quotes.length){
					LocalStorageQuotes.resetPreviousQuotes();
				}

				let prevIds = Enumerable.From(previous).Select(x => x.id);
				let quoteIds = Library.Utils.initArrayOrdered(quotes.length);
				let notSeen = Enumerable.From(quoteIds).Except(prevIds).ToArray();

				let hash = Library.Utils.hashCode(Library.Utils.now()) % notSeen.length;

				LocalStorageQuotes.setCurrentQuote(hash, Library.Utils.today(), Library.Utils.today(1));

				return quotes[notSeen[hash]];
			}
		}

		public static getRandomQuote = (notIn: string[] = []): Quote => {
			let movie = MoviesDB.getRandomMovie();
			if(movie == undefined || notIn[movie.slug] == true)
				return undefined;

			let quotes = QuotesDB.getByMovie(movie.slug);
			let quoteIds = Library.Utils.initArrayOrdered(quotes.length);
			let notSeen = Enumerable.From(quoteIds).Except(notIn).ToArray();			
			
			let hash = Library.Utils.hashCode(Library.Utils.now()) % notSeen.length;

			return quotes[notSeen[hash]];
		}
	}

	class LocalStorageQuotes{
		public static getPreviousQuotes = () => {
			let quotesJson = localStorage["previousQuotes"];
			let quotes = [];
			if(quotesJson){
				quotes = JSON.parse(quotesJson);
			}
			return quotes;
		}

		public static addPreviousQuote = (id, dateFrom, dateTo) => {
			let quotes = LocalStorageQuotes.getPreviousQuotes();
			id = parseInt(id.toString());
			quotes.push({id: id, dateFrom: dateFrom, dateTo: dateTo});
			localStorage["previousQuotes"] = JSON.stringify(quotes);
		}

		public static resetPreviousQuotes = () => {
			localStorage["previousQuotes"] = JSON.stringify([]);

		}

		public static getCurrentQuote = () => {
			let quote = localStorage["currentQuote"];
			return quote ? JSON.parse(quote): undefined;
		}

		public static setCurrentQuote = (id, dateFrom, dateTo) => {
			id = parseInt(id.toString());
			localStorage["currentQuote"] = JSON.stringify({id: id, dateFrom: dateFrom, dateTo});
		}
	}
}