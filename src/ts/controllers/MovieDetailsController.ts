/// <reference path="../_references.ts" />

module Controllers{
	export class MovieDetailsController extends BaseController{

		public beforeLoad = (route, args) => {
			let movie = new DB.MoviesDB().get(args.id);
			let quotes = new DB.QuotesDB().getByMovie(args.id);

			$("title").text("Movie Quotes - " + movie.title);
			
			this.Templater.template("templates/movie-details--list-quotes", {
				"movie": movie,
				"quotes": quotes.ToArray()
			});
		}
	}
}