/// <reference path="../_references.ts" />

module Views{
	export class Home{

		public static beforeLoad = (route, args) => {
			let count = 3;
			let prev = [];
			let templateData = {movies: []};

			for(let i = 1; i <= count; i++){
				let quote = DB.QuotesDB.getRandomQuote(prev);
				if(quote){
					let movie = DB.MoviesDB.get(quote.movieId);

					templateData["movies"].push({
						"movie-id": movie.id,
						"movie-title": movie.title,
						"movie-cover-photo": movie.coverPhoto,
						"quote-text": quote.text
					})

					prev.push(quote.id);
				}
			}
			
			Views.Index.Templater.template("quotes-template", templateData);
		}
	}
}