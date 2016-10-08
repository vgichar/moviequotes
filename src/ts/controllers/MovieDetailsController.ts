/// <reference path="../_references.ts" />

module Controllers{
	export class MovieDetailsController{

		public static beforeLoad = (route, args) => {
			let movie = new DB.MoviesDB().get(args.id);
			let quotes = new DB.QuotesDB().getByMovie(args.id);

			$("title").text("Movie Quotes - " + movie.title);
			
			IndexController.Templater.template("movie-details--list-quotes", {
				"movie": movie,
				"quotes": quotes.ToArray()
			});
		}
	}
}