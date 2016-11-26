var through = require('through2');

var parse = (function () {
	return through.obj(function (file, enc, cb) {
		console.log(file);

		var html = '"' + html;
		html = html + '"';

		var concatRegex = buildRegex("{{", "}}");
		var concatMatches = html.match(concatRegex);
		for(var i in concatMatches){
			var content = concatMatches[i].replace(concatRegex, "$1");
			html = html.replace("{{" + content + "}}", '" + ' + content  + ' + "');
		}

		var evalRegex = buildRegex("{%", "%}");
		var evalMatches = html.match(evalRegex);
		for(var i in evalMatches){
			var content = evalMatches[i].replace(evalRegex, "$1");
			html = html.replace("{%" + content + "%}", '" + ' + content  + ' + "');
		}

		cb(null, file);
	});

	function buildRegex(start, end){
		var content = "(((.|\\n|\\r)(?!" + end + "))*.)";
		var regex = new RegExp(start  + content + end, 'g');

		return regex;
	}

	function trim(text, char){
		while(text[0] == char){
			text = text.substring(1);
		}
		while(text[text.length - 1] == char){
			text = text.substring(-1);
		}
		return text;
	}
})();

module.exports = parse;