/// <reference path="../_references.ts" />

module DB{
	class Movie{
		public id: number;
		public title: string;
		public year: number;
		public coverPhoto: string;
	}

	export class MoviesDB{
		public static all = () : {id:number, title:string, year:number, coverPhoto:string}[] => {
			return Library.Filer.Current().getFile("json/movies.json");
		}

		public static take = (offset, take): {id:number, title:string, year:number, coverPhoto:string}[] => {
			return MoviesDB.all().slice(offset, offset + take);
		}

		public static get = (id): {id:number, title:string, year:number, coverPhoto:string} => {
			id = parseInt(id.toString());
			return Enumerable.From(MoviesDB.all()).Single(x => x.id == id);
		}

		public static getMovieOfTheDay = (): {id:number, title:string, year:number, coverPhoto:string} => {
			let movies = MoviesDB.all();
			let previous = LocalStorageMovies.getPreviousMovies();
			let current = LocalStorageMovies.getCurrentMovie();

			if(!current){
				let hash = Library.Utils.hashCode(Library.Utils.now()) % movies.length;
				LocalStorageMovies.setCurrentMovie(hash, Library.Utils.today(), Library.Utils.today(1));
				return MoviesDB.get(hash);
			}

			if(current.dateFrom <= Library.Utils.now() && current.dateTo >= Library.Utils.now()){
				return MoviesDB.get(current.id);
			}else{
				LocalStorageMovies.addPreviousMovie(current.id, current.dateFrom, current.dateTo);

				if(previous.length == movies.length){
					LocalStorageMovies.resetPreviousMovies();
				}

				let prevIds = Enumerable.From(previous).Select(x => x.id);
				let movieIds = Library.Utils.initArrayOrdered(movies.length);
				let notSeen = Enumerable.From(movieIds).Except(prevIds).ToArray();

				let hash = Library.Utils.hashCode(Library.Utils.now()) % notSeen.length;

				LocalStorageMovies.setCurrentMovie(hash, Library.Utils.today(), Library.Utils.today(1));

				return MoviesDB.get(hash);
			}
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

		public static addPreviousMovie = (id, dateFrom, dateTo) => {
			let movies = LocalStorageMovies.getPreviousMovies();
			id = parseInt(id.toString());
			movies.push({id: id, dateFrom: dateFrom, dateTo: dateTo});
			localStorage["previousMovies"] = JSON.stringify(movies);
		}

		public static resetPreviousMovies = () => {
			localStorage["previousMovies"] = JSON.stringify([]);

		}

		public static getCurrentMovie = () => {
			let movie = localStorage["currentMovie"];
			return movie ? JSON.parse(movie): undefined;
		}

		public static setCurrentMovie = (id, dateFrom, dateTo) => {
			id = parseInt(id.toString());
			localStorage["currentMovie"] = JSON.stringify({id: id, dateFrom: dateFrom, dateTo});
		}
	}
}