/// <reference path="../../../typings/tsd.d.ts" />
/// <reference path="../libs/router.ts" />
/// <reference path="../libs/templater.ts" />


module Views{
	export class Index{
		public static Templater;
		public static Router;

		public boot = () =>{
			Index.Templater = new Library.Templater();

			Index.Router = new Library.Router();

			Index.Router.register("/", "home.html");
			Index.Router.registerNotFound("errors/404.html");
			Index.Router.defaultConvention(function(route){
				return route.trim("/") + ".html";
			});
			Index.Router.onLoaded(Index.Templater.work);
		}
	}
}

new Views.Index().boot();