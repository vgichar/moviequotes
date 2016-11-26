/// <reference path="_references.ts" />

module Controllers{
	export class IndexController{
		public static Templater: Library.Templater = new Library.Templater();
		public static Router: Library.Router = new Library.Router();
		public static Filer: Library.Filer = Library.Filer.Current();

		public constructor(){
			
		}

		public boot = () => {
			this.preloadFiles();
			this.registerRoutes();
			this.setQuoteOfTheDayTempalteData();
			this.makeMenuReactive();
			this.bootstrapSemanticComponents();

			IndexController.Router.onLoaded(IndexController.Templater.render);
		}

		private preloadFiles = () => {
			let bundles: any[] = IndexController.Filer.getFile('bundles.json');
			let items: string[] = [];

			for (var i = bundles.length - 1; i >= 0; i--) {
				items = items.concat(bundles[i].items);
				IndexController.Filer.registerBundle(bundles[i].templateFile, bundles[i].items);
			}
			
			IndexController.Filer.preloadFiles(items.concat([
				"json/movies.json",
				"json/series.json",
				"json/popular-content.json"
			]));
		}

		private registerRoutes = () => {
			IndexController.Router.defaultConvention(function(route){
				return route.trim("/") + ".html";
			});
			IndexController.Router.registerNotFound("errors/404.html");

			IndexController.Router.register("/", "home.html", HomeController);
			IndexController.Router.register("/movie-details/{id}", "movie-details.html", MovieDetailsController);
			IndexController.Router.register("/movies", "movies.html", MoviesAndSeriesController);
			IndexController.Router.register("/movies/{filter}", "movies.html", MoviesAndSeriesController);
			IndexController.Router.register("/movies/{filter}/{page}", "movies.html", MoviesAndSeriesController);
			
			IndexController.Router.register("/series", "series.html", MoviesAndSeriesController);
			IndexController.Router.register("/series/{filter}", "series.html", MoviesAndSeriesController);
			IndexController.Router.register("/series/{filter}/{page}", "series.html", MoviesAndSeriesController);
			IndexController.Router.register("/quiz", "quiz.html", QuizController);
		}

		private setQuoteOfTheDayTempalteData = () => {
			let quoteOfTheDay = new DB.QuotesDB().getQuoteOfTheDay();
			let movie = new DB.MoviesDB().getMovieOfTheDay();

			movie.slug = quoteOfTheDay.movieSlug;
			
			IndexController.Templater.template("templates/index--quote-of-the-day", {
				"movie": movie,
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
					$("nav a[href='home']").addClass("active");
				}else{
					$("nav a[href*='" + route.split("/")[0] + "']").addClass("active");
				}
			});
		}

		private bootstrapSemanticComponents = () => {
			let $$:any = $;
			$("#search").on("click", function () {
				IndexController.Router.go("/movies/");
			});
		}
	}
}