/// <reference path="../_references.ts" />

module DB{
	class Movie{
		public constructor(id, title, year, img){
			this.id = id;
			this.title = title;
			this.year = year;
			if(img && img != null){
				this.coverPhotoBase = img;
				this.coverPhoto = "https://images-na.ssl-images-amazon.com/images/M/" + img + "._V1_UX182_CR0,0,182,268_AL_.jpg";
				this.smallCoverPhoto = "https://images-na.ssl-images-amazon.com/images/M/" + img + "._V1_UX90_CR0,0,90,150_AL_.jpg";
				this.verySmallCoverPhoto = "https://images-na.ssl-images-amazon.com/images/M/" + img + "._V1_UX50_CR0,0,50,80_AL_.jpg";
			}else{
				this.coverPhotoBase = undefined;
				this.coverPhoto = "http://placehold.it/150x250";
				this.smallCoverPhoto = "http://placehold.it/100x150";
				this.verySmallCoverPhoto = "http://placehold.it/50x80";
			}
			this.slug = Library.Utils.slugify(title + " " + year);
		}

		public id: number;
		public title: string;
		public year: number;
		private coverPhotoBase: string;
		public coverPhoto: string;
		public smallCoverPhoto: string;
		public verySmallCoverPhoto: string;
		public slug: string;
	}

	export class MoviesDB{
		public static all = (): any => {
			let movies: any[] = Library.Filer.Current().getFile("json/movies.json");
			return Enumerable.From(movies).Select(x => new Movie(x.id, x.title, x.year, x.img));
		}

		public static take = (offset, take): Movie[] => {
			return MoviesDB.all().slice(offset, offset + take);
		}

		public static get = (slug): Movie => {
			return MoviesDB.all().Single(x => x.slug == slug);
		}

		public static getMovieOfTheDay = (): Movie => {
			let movies = MoviesDB.all().ToArray();
			let previous = LocalStorageMovies.getPreviousMovies();
			let current = LocalStorageMovies.getCurrentMovie();

			if(!current){
				let hash = Library.Utils.hashCode(Library.Utils.now()) % movies.length;
				LocalStorageMovies.setCurrentMovie(movies[hash].slug, Library.Utils.today(), Library.Utils.today(1));
				return movies[hash];
			}

			if(current.dateFrom <= Library.Utils.now() && current.dateTo >= Library.Utils.now()){
				return MoviesDB.get(current.slug);
			}else{
				LocalStorageMovies.addPreviousMovie(current.slug, current.dateFrom, current.dateTo);

				if(previous.length == movies.length){
					LocalStorageMovies.resetPreviousMovies();
				}

				let prevIds = Enumerable.From(previous).Select(x => x.slug);
				let movieIds = Library.Utils.initArrayOrdered(movies.length);
				let notSeen = Enumerable.From(movieIds).Except(prevIds).ToArray();

				let hash = Library.Utils.hashCode(Library.Utils.now()) % notSeen.length;

				LocalStorageMovies.setCurrentMovie(movies[hash], Library.Utils.today(), Library.Utils.today(1));

				return MoviesDB.get(hash);
			}
		}

		public static getRandomMovie = (notIn: string[] = []): Movie => {
			let notInEnum = Enumerable.From(notIn);
			let notSeenMovies = MoviesDB.all().Where(x => notInEnum.Any(y=>y == x.slug)).ToArray();
			
			if(notSeenMovies.length == 0)
				return undefined;
			
			let hash = Library.Utils.hashCode(Library.Utils.now()) % notSeenMovies.length;

			return MoviesDB.get(notSeenMovies[hash].slug);
		}

		public static getPopularMovies = () => {
			let movies: any[] = Library.Filer.Current().getFile("json/popular-movies.json");
			return Enumerable.From(movies).Select(x => new Movie(x.id, x.title, x.year, x.img));
		}
	}

	class LocalStorageMovies{
		public static getPreviousMovies = () => {
			let moviesJson = localStorage["previousMovies"];
			let movies = [];
			if(moviesJson){
				movies = JSON.parse(moviesJson);
			}
			return movies;
		}

		public static addPreviousMovie = (slug, dateFrom, dateTo) => {
			let movies = LocalStorageMovies.getPreviousMovies();
			movies.push({slug: slug, dateFrom: dateFrom, dateTo: dateTo});
			localStorage["previousMovies"] = JSON.stringify(movies);
		}

		public static resetPreviousMovies = () => {
			localStorage["previousMovies"] = JSON.stringify([]);

		}

		public static getCurrentMovie = () => {
			let movie = localStorage["currentMovie"];
			return movie ? JSON.parse(movie): undefined;
		}

		public static setCurrentMovie = (slug, dateFrom, dateTo) => {
			localStorage["currentMovie"] = JSON.stringify({slug: slug, dateFrom: dateFrom, dateTo});
		}
	}
}