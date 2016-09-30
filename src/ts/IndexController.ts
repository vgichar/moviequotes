/// <reference path="_references.ts" />

module Controllers{
	export class IndexController{
		public static Templater = new Library.Templater();
		public static Router = new Library.Router();
		public static Filer = Library.Filer.Current();

		public constructor(){
			
		}

		public boot = () => {
			this.preloadFiles();
			this.registerRoutes();
			this.setQuoteOfTheDayTempalteData();
			this.makeMenuReactive();

			IndexController.Router.onLoaded(IndexController.Templater.work);
		}

		private preloadFiles = () => {
			IndexController.Filer.preloadFiles([
				// views
				"home.html",
				"movies.html",
				"movie-details.html",
				// viewsend
				// templaets
				"templates/movie-details--list-quotes.html",
				"templates/movies--browse.html",
				"templates/movies--list.html",
				"templates/home--popular-movies.html",
				"templates/index--quote-of-the-day.html",
				// templatesend
				"json/movies.json",
				"json/popular-content.json"
			]);
		}

		private registerRoutes = () => {
			IndexController.Router.defaultConvention(function(route){
				return route.trim("/") + ".html";
			});
			IndexController.Router.registerNotFound("errors/404.html");

			IndexController.Router.register("/", "home.html", HomeController);
			IndexController.Router.register("/movie-details/{id}", "movie-details.html", MovieDetailsController);
			IndexController.Router.register("/movies", "movies.html", MoviesController);
			IndexController.Router.register("/movies/{start}", "movies.html", MoviesController);
		}

		private setQuoteOfTheDayTempalteData = () => {
			let quoteOfTheDay = new DB.QuotesDB().getQuoteOfTheDay();
			let movie = new DB.MoviesDB().get(quoteOfTheDay.movieSlug);
			
			IndexController.Templater.template("index--quote-of-the-day", {
				"movie": {
					"slug": quoteOfTheDay.movieSlug,
					"name": movie.title,
					"coverPhoto": movie.coverPhoto,
				},
				"quote": {
					"lines": quoteOfTheDay.lines,
					"likes": parseInt((Math.random() * 100000).toString())
				}
			});
		}

		private makeMenuReactive = () => {
			IndexController.Router.onLoading(function (route) {
				$("nav a").removeClass("active");
				if(route.length < 2){
					$("nav a[href*='home']").addClass("active");
				}else{
					$("nav a[href*='" + route.split("/")[0] + "']").addClass("active");
				}
			});
		}
	}
}