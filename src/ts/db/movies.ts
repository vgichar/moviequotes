/// <reference path="../_references.ts" />

module DB{
	class Movie{
		public title: string;
		public year: number;
		public coverPhoto: string;
	}

	export class MoviesDB{
		public static all = () : any[] => {
			return Library.Filer.Current().getFile("json/movies.json");
		}

		public static take = (offset, take) => {
			return MoviesDB.all().slice(offset, offset + take);
		}

		public static get = (id) => {
			id = parseInt(id.toString());
			return MoviesDB.all()[id];
		}

		public static getMovieOfTheDay = () => {
			let movies = MoviesDB.all();
			let previous = LocalStorageMovies.getPreviousMoviesOfTheDay();
			let current = LocalStorageMovies.getCurrentMovieOfTheDay();

			if(!current){
				let hash = Library.Utils.hashCode(Library.Utils.today()) % movies.length;
				LocalStorageMovies.setCurrentMovieOfTheDay(hash);
				return MoviesDB.get(hash);
			}

			if(current.date == Library.Utils.today()){
				return MoviesDB.get(current.id);
			}else{
				LocalStorageMovies.addPreviousMovieOfTheDay(current.id, current.date);

				if(previous.length == movies.length){
					LocalStorageMovies.resetPreviousMoviesOfTheDay();
				}

				let prevIds = Enumerable.From(previous).Select(x => x.id);
				let movieIds = Library.Utils.initArrayOrdered(movies.length);
				let notSeen = Enumerable.From(movieIds).Except(prevIds).ToArray();

				let hash = Library.Utils.hashCode(Library.Utils.today()) % notSeen.length;

				LocalStorageMovies.setCurrentMovieOfTheDay(hash);

				return MoviesDB.get(hash);
			}
		}
	}

	class LocalStorageMovies{
		public static getPreviousMoviesOfTheDay = () => {
			let moviesJson = localStorage["previousMoviesOfTheDay"];
			let movies = [];
			if(moviesJson){
				movies = JSON.parse(moviesJson);
			}
			return movies;
		}

		public static addPreviousMovieOfTheDay = (id, date) => {
			let movies = LocalStorageMovies.getPreviousMoviesOfTheDay();
			id = parseInt(id.toString());
			movies.push({id: id, date: date});
			localStorage["previousMoviesOfTheDay"] = JSON.stringify(movies);
		}

		public static resetPreviousMoviesOfTheDay = () => {
			localStorage["previousMoviesOfTheDay"] = JSON.stringify([]);

		}

		public static getCurrentMovieOfTheDay = () => {
			let movie = localStorage["currentMovieOfTheDay"];
			return movie ? JSON.parse(movie): undefined;
		}

		public static setCurrentMovieOfTheDay = (id) => {
			id = parseInt(id.toString());
			localStorage["currentMovieOfTheDay"] = JSON.stringify({id: id, date: Library.Utils.today()});
		}
	}
}