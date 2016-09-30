/// <reference path="../_references.ts" />

module DB{
	class MovieModel extends BaseModel{
		public constructor(id, title, year, img){
			super(id);
			this.title = title;
			this.year = year;
			this.coverPhoto = this.resizeImage(img, 182, 268);
			this.smallCoverPhoto = this.resizeImage(img, 120, 175);
			this.verySmallCoverPhoto = this.resizeImage(img, 90, 130);
			this.slug = Library.Utils.slugify(title + " " + year);
		}

		public title: string;
		public year: number;
		public coverPhoto: string;
		public smallCoverPhoto: string;
		public verySmallCoverPhoto: string;
		public slug: string;

		private resizeImage(img, w, h){
			if(img && img != null){
				return img.replace("UX182", "UX" + w).replace(",182", "," + w).replace(",268", "," + h)
			}else{
				return "http://placehold.it/" + w + "x" + h;
			}
		}
	}

	export class MoviesDB extends BaseDB<MovieModel>{
		public constructor(){
			super("json/movies.json");
		}

		public all(): linq.Enumerable<MovieModel> {
			let all = super.all().Select(x => new MovieModel(x.id, x.title, x.year, x.img));
			return all;
		}

		public getByStart(str: string): linq.Enumerable<MovieModel> {
			str = str.toLowerCase();
			return this.all().Where(x => x.title.toLowerCase().indexOf(str) == 0);
		}

		public take (offset, take): linq.Enumerable<MovieModel> {
			return this.all().Skip(offset).Take(take);
		}

		public get (slug): MovieModel {
			return this.all().Single(x => x.slug == slug);
		}

		public getMovieOfTheDay (): MovieModel {
			let content: any = this.getPopularContent();
			let movie = content['movie-of-the-day'];
			return new MovieModel(movie.id, movie.title, movie.year, movie.img);
		}

		public getPopularMovies (): linq.Enumerable<MovieModel> {
			let content: any = this.getPopularContent();
			let movies: any[] = content['popular-movies']
			return Enumerable.From(movies).Select(x => new MovieModel(x.id, x.title, x.year, x.img));
		}

		public getRandomMovie (notIn: string[] = []): MovieModel {
			let notInEnum = Enumerable.From(notIn);
			let notSeenMovies = this.all().Where(x => notInEnum.Any(y=>y == x.slug)).ToArray();
			
			if(notSeenMovies.length == 0)
				return undefined;
			
			let hash = Library.Utils.hashCode(Library.Utils.now()) % notSeenMovies.length;

			return this.get(notSeenMovies[hash].slug);
		}
	}
}