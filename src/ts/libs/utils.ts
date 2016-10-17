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

		public static initArrayOrdered = (size, startChar = 0) => {
			let result = [];
			for(let i = 0; i < size; i++){
				result.push(startChar + i);
			}

			return result;
		}

		public static today = (addDays = 0, addMonths = 0, addYears = 0) => {
			let today = new Date();
			let desiredDate = new Date(today.getFullYear() + addYears, today.getMonth() + addMonths, today.getDate() + addDays, today.getHours(), today.getMinutes(), today.getSeconds());
			let dd = desiredDate.getDate();
			let mm = desiredDate.getMonth()+1; //January is 0!
			let yyyy = desiredDate.getFullYear();

			let d: string = dd.toString();
			let m: string = mm.toString();

			if(dd < 10) {
			    d = '0' + dd;
			} 

			if(mm < 10) {
			    m = '0' + mm;
			} 

			return yyyy + '/' + m + '/' + d;
		}

		public static now = (addSeconds = 0, addMinutes = 0, addHours = 0, addDays = 0, addMonths = 0, addYears = 0) => {

			let today = new Date();
			let desiredDate = new Date(today.getFullYear() + addYears, today.getMonth() + addMonths, today.getDate() + addDays, today.getHours() + addHours, today.getMinutes() + addMinutes, today.getSeconds() + addSeconds);
			let ss = desiredDate.getSeconds();
			let min = desiredDate.getMinutes();
			let hh = desiredDate.getHours();
			let dd = desiredDate.getDate();
			let mm = desiredDate.getMonth()+1; //January is 0!
			let yyyy = desiredDate.getFullYear();

			let d: string = dd.toString();
			let m: string = mm.toString();
			let h: string = hh.toString();
			let mi: string = min.toString();
			let s: string = ss.toString();

			if(dd < 10) {
			    d = '0' + dd;
			} 

			if(mm < 10) {
			    m = '0' + mm;
			} 


			if(dd < 10) {
			    d = '0' + dd;
			} 

			if(mm < 10) {
			    m = '0' + mm;
			} 

			if(hh < 10) {
			    h = '0' + hh;
			} 

			if(min < 10) {
			    mi = '0' + min;
			} 

			if(ss < 10) {
			    s = '0' + ss;
			} 

			return yyyy + '/' + m + '/' + d + " " + h + ":" + mi + ":" + s;
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
		}

		public static flattenJSON = (data) => {
		    var result = {};
		    function recurse (cur, prop) {
		        if (Object(cur) !== cur) {
		            result[prop] = cur;
		        } else if (Array.isArray(cur)) {
		        	let l = cur.length;
		            for(var i = 0; i < l; i++){
		                recurse(cur[i], prop + "[" + i + "]");
		            }
		            if (l == 0){
		                result[prop] = [];
		            }
		        } else {
		            var isEmpty = true;
		            for (var p in cur) {
		                isEmpty = false;
		                recurse(cur[p], prop ? prop+"."+p : p);
		            }
		            if (isEmpty && prop)
		                result[prop] = {};
		        }
		    }
		    recurse(data, "");
		    return result;
		}

		public static unflattenJSON = (data) => {
		    "use strict";
		    if (Object(data) !== data || Array.isArray(data))
		        return data;
		    var regex = /\.?([^.\[\]]+)|\[(\d+)\]/g,
		        resultholder = {};
		    for (var p in data) {
		        var cur = resultholder,
		            prop = "",
		            m;
		        while (m = regex.exec(p)) {
		            cur = cur[prop] || (cur[prop] = (m[2] ? [] : {}));
		            prop = m[2] || m[1];
		        }
		        cur[prop] = data[p];
		    }
		    return resultholder[""] || resultholder;
		};

		public static slugify = (str : string) => {
			str = str
		        .toLowerCase()
		        .replace('\'','-');
		    return str.replace(/[^a-zA-Z0-9-\s]+/g,'')
		        .replace(/ +/g,'-')
		        .replace(new RegExp("^-"), "")
		        .replace(new RegExp("-$"), "")
		        .replace(new RegExp("--"), "-");
		}

		public static htmlEncode = (str: string) => {
		  var el = document.createElement("div");
		  el.innerHTML = str;
		  return el.innerText;
		}

		public static escapeRegExp = (str:string) => {
		  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
		}
	}
}