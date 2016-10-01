/// <reference path="../_references.ts" />

module Library{
	export class Filer{
		private cache = {};
		private isDownloading = {};
		private bundles = {};
		private filesInBundle = {};

		private static _current;
		public static Current = (): Filer => {
			if(!Filer._current){
				Filer._current = new Filer();
			}
			return Filer._current;
		};

		public registerBundle = (bundleName: string, fileNames: string[]) => {
			this.bundles[bundleName] = fileNames;
			for(let i in fileNames){
				this.filesInBundle[fileNames[i]] = bundleName;
			}
		}

		public preloadFiles = (files) => {
			let self = this;
			for(let i in files){
				this.downloadFile(files[i], true);
			}
		}

		public getFile = (fileName) => {
			this.downloadFile(fileName, false);

			return this.cache[fileName];
		}

		private getFileContentLocation(fileName){
			return this.filesInBundle[fileName] ? this.filesInBundle[fileName] : fileName;
		}

		private cacheFile(fileName, data = undefined){
			this.cache[fileName] = data ? data : this.cache[fileName];

			return this.cache[fileName];
		}

		private downloadFile(fileName, async = true){
			let or_bundleFile = this.getFileContentLocation(fileName);
			let isBundle = or_bundleFile != fileName;
			if(!this.cacheFile(fileName) && (!async || !this.isDownloading[or_bundleFile])){
				this.isDownloading[or_bundleFile] = true;
				let self = this;
				return $.ajax({
					method: "GET",
					url: or_bundleFile,
					async: async
				}).done(function(data){
					if(!isBundle){
						self.cacheFile(fileName, data);
					}else{
						self.processBundleToCache(data);
					}
				});
			}
		}

		private processBundleToCache(data){
			for(let file in data){
				this.cacheFile(file, data[file]);
			}
		}
	}
}