/// <reference path="../_references.ts" />

module Views{
	export class Movies{

		public static beforeLoad = (route, args) => {
			let start = args.start;
			if(start){
				Views.Index.Templater.template("movies-template", {
					"movies": DB.MoviesDB.getByStart(start).ToArray()
				});
			}else{
				Views.Index.Templater.template("movies-template", {
					"movies": DB.MoviesDB.all().ToArray()
				});
			}
			Views.Index.Templater.template("movies-browse-template", {
				"letters": Library.Utils.initArrayOrdered(26, 'A'.charCodeAt(0)).concat(Library.Utils.initArrayOrdered(10, '0'.charCodeAt(0)))
			});
		}
	}
}