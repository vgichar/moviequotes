/// <reference path="../_references.ts" />

module Views{
	export class Home{

		public static onBeforeLoad = (route, args) => {
			let movies = DB.MoviesDB.getMovieOfTheDay();

			console.log(movies);

			Views.Index.Templater.template("quote-of-the-day", {
				"movie.id": 45,
				"movie.name": "Fight club",
				"movie.year": 1999,
				"quote.text": "First",
				"quote.when": "150"
			});
		}
	}
}