/// <reference path="../_references.ts" />

module Views{
	export class Home{

		public static beforeLoad = (route, args) => {
			let templateData = {};
			let movies = DB.MoviesDB.getPopularMovies().ToArray();

			for(let i in movies){
				movies[i]["quote"] = DB.QuotesDB.getByMovie(movies[i].slug).First();
			}

			templateData["movies"] = movies;
			
			Views.Index.Templater.template("popular-movies-template", templateData);
		}
	}
}