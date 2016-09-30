/// <reference path="../_references.ts" />

module Controllers{
	export class HomeController{

		public static beforeLoad = (route, args) => {
			let movies = new DB.MoviesDB().getPopularMovies().ToArray();

			for(let i in movies){
				movies[i]["quote"] = new DB.QuotesDB().getByMovie(movies[i].slug).First();
			}

			IndexController.Templater.template("home--popular-movies", {movies: movies});
		}
	}
}