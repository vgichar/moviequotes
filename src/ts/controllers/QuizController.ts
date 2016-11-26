/// <reference path="../_references.ts" />

module Controllers{
	export class QuizController extends BaseController{

		public beforeLoad = (route, args) => {
			this.Templater.template("templates/quiz--question", {
				"title": "From which movie is this quote?",
				"quote": "Quote 1",
				"movies": [
					"Batman",
					"Superman",
					"Spiderman"
				]
			})
		}

		public afterLoad = (route, args) => {
		}
	}
}