/// <reference path="../_references.ts" />

module Controllers{
	export class HomeController extends BaseController{

		public beforeLoad = (route, args) => {
			$("title").text("Movie Quotes - Popular movies");
			
			let movies = new DB.MoviesDB().getPopularMovies().ToArray();
			let quotes = new DB.QuotesDB().getPopularMovieQuotes().ToArray();

			for(let i in movies){
				for(let j in quotes){
					if(movies[i].slug == quotes[j].movieSlug){
						movies[i]["quote"] = quotes[j];
					}
				}
			}

			this.Templater.template("templates/home--popular-movies", {movies: movies});
		}
	}
}