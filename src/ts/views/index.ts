/// <reference path="../_references.ts" />

module Views{
	export class Index{
		public static Templater = new Library.Templater();
		public static Router = new Library.Router();
		public static Filer = Library.Filer.Current();

		public boot = () => {
			this.preloadFiles();
			this.registerRoutes();
			this.setQuoteOfTheDayTempalteData();
			this.makeMenuReactive();

			Index.Router.onLoaded(Index.Templater.work);
		}

		private preloadFiles = () => {
			Index.Filer.preloadFiles([
				"home.html",
				"movie-details.html",
				"templates/movie-details-template.html",
				"templates/quote-of-the-day.html",
				"json/movies.json"
			]);
		}

		private registerRoutes = () => {
			Index.Router.defaultConvention(function(route){
				return route.trim("/") + ".html";
			});
			Index.Router.registerNotFound("errors/404.html");

			Index.Router.register("/", "home.html", Views.Home);
			Index.Router.register("/movie-details/{id}", "movie-details.html", Views.MovieDetails);
			Index.Router.register("/movies", "movies.html", Views.Movies);
		}

		private setQuoteOfTheDayTempalteData = () => {
			let quoteOfTheDay = DB.QuotesDB.getQuoteOfTheDay();
			let movie = DB.MoviesDB.get(quoteOfTheDay.movieId);

			Views.Index.Templater.template("quote-card-template", {
				"movie": {
					"id": quoteOfTheDay.movieId,
					"name": movie.title,
					"cover-photo": movie.coverPhoto,
				},
				"quote": {
					"text": quoteOfTheDay.text,
					"likes": parseInt((Math.random() * 100000).toString())
				}
			});
		}

		private makeMenuReactive = () => {
			Index.Router.onLoading(function (route) {
				$("nav a").removeClass("active");
				$("nav a[href*='" + route + "']").addClass("active");
			});
		}
	}
}