/// <reference path="../_references.ts" />

module Views{
	export class Index{
		public static Templater;
		public static Router;
		public static Filer;

		public boot = () =>{
			Index.Templater = new Library.Templater();
			Index.Router = new Library.Router();
			Index.Filer = Library.Filer.Current();

			Index.Filer.preloadFiles([
				"home.html",
				"movie-details.html",
				"templates/movie-details-template.html",
				"templates/quote-of-the-day.html",
				"json/movies.json"
				]);

			Index.Router.register("/", "home.html", Views.Home.onBeforeLoad);
			Index.Router.register("/movie-details/{id}", "movie-details.html", function(route, args){
				Views.Index.Templater.template("movie-details-template", {
					"movie.name": "Fight club"
				});
			});
			
			Index.Router.registerNotFound("errors/404.html");
			Index.Router.defaultConvention(function(route){
				return route.trim("/") + ".html";
			});

			Index.Router.onLoaded(Index.Templater.work);
		}
	}
}