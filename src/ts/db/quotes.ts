/// <reference path="../_references.ts" />

module DB{
	class Quote{
		public id: number;
		public movieId: number;
		public text: string;
	}

	export class QuotesDB{
		public static all = (): {id:number, movieId:number, text:string}[] => {
			return Library.Filer.Current().getFile("json/quotes.json");
		}

		public static take = (offset, take): {id:number, movieId:number, text:string}[] => {
			return QuotesDB.all().slice(offset, offset + take);
		}

		public static get = (id): {id:number, movieId:number, text:string} => {
			id = parseInt(id.toString());
			return Enumerable.From(QuotesDB.all()).Single(x => x.id == id);
		}

		public static getByMovie = (movieId): {id:number, movieId:number, text:string}[] => {
			movieId = parseInt(movieId.toString());
			return Enumerable.From(QuotesDB.all()).Where(x => x.movieId == movieId).ToArray();
		}

		public static getQuoteOfTheDay = () => {
			let quotes = QuotesDB.all();
			let previous = LocalStorageQuotes.getPreviousQuotes();
			let current = LocalStorageQuotes.getCurrentQuote();

			if(!current){
				let hash = Library.Utils.hashCode(Library.Utils.now()) % quotes.length;
				LocalStorageQuotes.setCurrentQuote(hash, Library.Utils.today(), Library.Utils.today(1));
				return QuotesDB.get(hash);
			}

			if(current.dateFrom <= Library.Utils.now() && current.dateTo >= Library.Utils.now()){
				return QuotesDB.get(current.id);
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

				return QuotesDB.get(notSeen[hash]);
			}
		}

		public static getRandomQuote = (notIn: number[] = []): {id:number, movieId:number, text:string} => {
			let quotes = QuotesDB.all();
			let quoteIds = Library.Utils.initArrayOrdered(quotes.length);
			let notSeen = Enumerable.From(quoteIds).Except(notIn).ToArray();
			
			if(notSeen.length == 0)
				return undefined;
			
			let hash = Library.Utils.hashCode(Library.Utils.now()) % notSeen.length;

			return QuotesDB.get(notSeen[hash]);
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