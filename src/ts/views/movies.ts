/// <reference path="../_references.ts" />

module Views{
	export class Movies{

		public static beforeLoad = (route, args) => {
			Views.Index.Templater.template("movies-template", {
				"movies": DB.MoviesDB.all().ToArray()
			});
		}
	}
}