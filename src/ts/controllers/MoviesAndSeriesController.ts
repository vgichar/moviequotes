/// <reference path="../_references.ts" />

module Controllers{
	export class MoviesAndSeriesController extends BaseController{
		private filterCondition = undefined;
		private pageSize = 100;
		private page = 0

		private db;

		public beforeLoad = (route, args) => {
			let self = this;
			self.db = new DB.MoviesDB();
			$("#search").val('');

			self.filterCondition = args.filter || "";
			self.page = args.page ? parseInt(args.page) - 1 : 0;
			self.page = Math.max(self.page, 0);

			self.filter();
			self.navigate();

			$("title").text("Movie Quotes - Browse movies");
		}

		public afterLoad = (route, args) => {
			let self = this;
			let timeoutId = undefined;
			$("#search").on("keyup", function () {
				clearTimeout(timeoutId);
				timeoutId = setTimeout(function(){
					self.filterCondition = $("#search").val();

					self.filter();
					self.navigate();

					self.Templater.reloadTemplate("templates/movies--list");
					self.Templater.reloadTemplate("templates/movies--browse");
				}, 300)
			});
		}

		private filter = () => {
			let self = this;
			self.Templater.template("templates/movies--list", {
				"movies": self.db.getByStart(self.filterCondition).OrderBy(x => x.title).Skip(self.page * self.pageSize).Take(self.pageSize).ToArray()
			});
		}

		private navigate = () => {
			let self = this;

			let page = self.page;
			let realPage = page + 1;
			let pageCount = Math.ceil(self.db.getByStart(self.filterCondition).Count() / self.pageSize);
			let pages = [];
			let padding = 3;

			for (let i = Math.max(1, realPage - padding); i <= Math.min(realPage + padding, pageCount); i++){
				pages.push(i);
			}

			self.Templater.template("templates/movies--browse", {
				"letters": Library.Utils
					.initArrayOrdered(26, 'A'.charCodeAt(0))
					.concat(Library.Utils.initArrayOrdered(10, '0'.charCodeAt(0))),
				"pages": pages,
				"pageNum": page,
				"pageCount": pageCount,
				"isPrevPadded" : pages[0] != 1,
				"isNextPadded" : pages[pages.length - 1] < pageCount,
				"filter": self.filterCondition
			});
		}
	}
}