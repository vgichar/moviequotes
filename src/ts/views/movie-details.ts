/// <reference path="../_references.ts" />

module Views{
	export class MovieDetails{

		public static beforeLoad = (route, args) => {
			let movie = DB.MoviesDB.get(args.id);
			let quotes = DB.QuotesDB.getByMovie(args.id);
			
			Views.Index.Templater.template("movie-details-template", {
				"movie": movie,
				"quotes": quotes.ToArray()
			});
		}
	}
}