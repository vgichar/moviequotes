/// <reference path="../_references.ts" />

module Library{
	export class Filer{
		private cache = {};

		private static _current;
		public static Current = () => {
			if(!Filer._current){
				Filer._current = new Filer();
			}
			return Filer._current;
		};

		public preloadFiles = (files) => {
			let self = this;
			for(let i in files){
				$.get(files[i]).done(function(data){
					self.cache[files[i]] = data;
				});
			}
		}

		public getFile = (fileName) => {
			let self = this;
			
			if(!self.cache[fileName]){
				$.ajax({
					method: "GET",
					url: fileName,
					async: false
				}).done(function(data){
					self.cache[fileName] = data;
				});
			}

			return self.cache[fileName];
		}
	}
}