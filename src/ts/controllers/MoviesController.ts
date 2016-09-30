/// <reference path="../_references.ts" />

module Controllers{
	export class MoviesController{

		public static beforeLoad = (route, args) => {
			let start = args.start;
			let moviesDB = new DB.MoviesDB();
			if(start){
				IndexController.Templater.template("movies--list", {
					"movies": moviesDB.getByStart(start).Take(500).ToArray()
				});
			}else{
				IndexController.Templater.template("movies--list", {
					"movies": moviesDB.take(0, 500).ToArray()
				});
			}
			IndexController.Templater.template("movies--browse", {
				"letters": Library.Utils.initArrayOrdered(26, 'A'.charCodeAt(0)).concat(Library.Utils.initArrayOrdered(10, '0'.charCodeAt(0)))
			});
		}
	}
}