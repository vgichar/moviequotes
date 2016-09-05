/// <reference path="../_references.ts" />

module Library{
	export class Utils{
		public static loadFile = (fileName, callback, fail) => {
			let data = Library.Filer.Current().getFile(fileName);
			if(data){
				return callback(data);
			}else{
				return fail();
			}
		}

		public static initArray = (size, fillChars) => {
			let result = [];
			for(let i = 0; i < length; i++){
				result.push(fillChars);
			}

			return result;
		}

		public static initArrayOrdered = (size) => {
			let result = [];
			for(let i = 0; i < size; i++){
				result.push(i);
			}

			return result;
		}

		public static today = () => {
			let today = new Date();
			let dd = today.getDate();
			let mm = today.getMonth()+1; //January is 0!
			let yyyy = today.getFullYear();

			let d: string = dd.toString();
			let m: string = mm.toString();

			if(dd < 10) {
			    d = '0' + dd;
			} 

			if(mm < 10) {
			    m = '0' + mm;
			} 

			return d + '/' + m + '/' + yyyy;
		}

		public static hashCode = function(str) {
			let hash = 0, i, chr, len;
			if (str.length === 0) return hash;
			for (i = 0, len = str.length; i < len; i++) {
				chr   = str.charCodeAt(i);
				hash  = ((hash << 5) - hash) + chr;
				hash |= 0; // Convert to 32bit integer
			}
			return Math.abs(hash);
		};
	}
}