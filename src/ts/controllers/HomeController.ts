/// <reference path="../_references.ts" />

module Controllers{
	export class HomeController{

		public static beforeLoad = (route, args) => {
			let eMovies = new DB.MoviesDB().getPopularMovies();
			let movieSlugs = eMovies.Select(x => x.slug).ToArray();
			let movies = eMovies.ToArray();

			let quotes = new DB.QuotesDB().getByMovies(movieSlugs).ToArray();

			for(let i in movies){
				for(let j in quotes){
					if(movies[i].slug == quotes[j].movieSlug){
						movies[i]["quote"] = quotes[j];
					}
				}
			}

			IndexController.Templater.template("home--popular-movies", {movies: movies});
		}
	}
}