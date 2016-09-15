/// <reference path="../_references.ts" />
var Library;
(function (Library) {
    var Router = (function () {
        function Router() {
            var _this = this;
            this.routeCache = {};
            this.routeCacheSize = 100;
            this.routeMap = {};
            this.onLoadingCallbacks = [];
            this.onLoadedCallbacks = [];
            this.bootstrap = function () {
                var self = _this;
                $(window).on("load hashchange", function () {
                    var route = self.getCurrentRoute();
                    var view = self.getViewOfRoute(route);
                    var args = self.getArgumentsOfRoute(route);
                    var entry = self.getRouteEntry(route);
                    var rtViews = document.getElementsByTagName('rtview');
                    for (var i in rtViews) {
                        rtViews[i].className = rtViews[i].className ? rtViews[i].className.replace("loaded", "") : "";
                        rtViews[i].className += "loading";
                    }
                    document.body.className = document.body.className ? document.body.className.replace("loaded", "") : "";
                    document.body.className += "loading";
                    for (var i in self.onLoadingCallbacks) {
                        self.onLoadingCallbacks[i](route);
                    }
                    Library.Utils.loadFile(view, function (childViewHtml) {
                        if (entry.controller && entry.controller.beforeLoad) {
                            entry.controller.beforeLoad(route, args);
                        }
                        for (var i in rtViews) {
                            rtViews[i].className = rtViews[i].className ? rtViews[i].className.replace("loading", "") : "";
                            rtViews[i].className += "loaded";
                            rtViews[i].innerHTML = childViewHtml;
                        }
                        document.body.className = document.body.className ? document.body.className.replace("loading", "") : "";
                        document.body.className += "loaded";
                        for (var i in self.onLoadedCallbacks) {
                            self.onLoadedCallbacks[i](route);
                        }
                        if (entry.controller && entry.controller.afterLoad) {
                            entry.controller.afterLoad(route, args);
                        }
                    }, function () {
                        $.get(self.notFoundView).done(function (errorViewHtml) {
                            for (var i in rtViews) {
                                rtViews[i].innerHTML = errorViewHtml;
                            }
                        });
                    });
                });
            };
            this.go = function (route) {
                window.location.href = _this.appendHahsbang(route);
            };
            this.back = function () {
                window.history.back();
            };
            this.register = function (route, view, controller) {
                if (controller === void 0) { controller = undefined; }
                route = _this.prepRouteForQuerying(route);
                _this.routeMap[route] = { view: view, controller: controller, route: route };
            };
            this.registerNotFound = function (view) {
                _this.notFoundView = view;
            };
            this.defaultConvention = function (defaultTransformation) {
                _this.defaultTransformation = defaultTransformation;
            };
            this.onLoading = function (callback) {
                _this.onLoadingCallbacks.push(callback);
            };
            this.onLoaded = function (callback) {
                _this.onLoadedCallbacks.push(callback);
            };
            this.appendHahsbang = function (route) {
                route = route.indexOf("#!") < 0 ? "#!" + route : route;
                route = route.indexOf("/") < 0 ? "/" + route : route;
                route = route.indexOf("/#!/") != 0 ? route.replace("/#!", "/#!/") : route;
                return route;
            };
            this.prepRouteForQuerying = function (route) {
                return route ? route.replace("/", "") : route;
            };
            this.getCurrentRoute = function () {
                var urlParts = window.location.href.split("#!");
                var route = urlParts.length == 2 ? urlParts[1] : "/";
                route = route.length > 0 ? route : "/";
                route = _this.prepRouteForQuerying(route);
                return route;
            };
            this.getViewOfRoute = function (route) {
                var self = _this;
                var entry = self.getRouteEntry(route);
                var view = entry ? entry.view : undefined;
                if (!view) {
                    if (self.defaultTransformation) {
                        view = self.defaultTransformation(route);
                    }
                }
                return view;
            };
            this.getArgumentsOfRoute = function (route) {
                var self = _this;
                var entry = self.getRouteEntry(route);
                return entry ? self.getRouteArguments(route, entry.route) : {};
            };
            this.getRouteEntry = function (route) {
                var self = _this;
                var entry = self.routeCache[route] || self.routeMap[route];
                var entryRoute = route;
                if (!entry) {
                    entryRoute = self.getRouteEntryWithWildcard(route);
                    if (entryRoute) {
                        entry = self.routeMap[entryRoute];
                    }
                }
                if (entry) {
                    self.routeCache[route] = entry;
                }
                return entry;
            };
            this.getRouteEntryWithWildcard = function (route) {
                var self = _this;
                var routeParts = route.split("/");
                var mapKeys = Object.keys(self.routeMap);
                for (var k in mapKeys) {
                    var key = mapKeys[k];
                    var keyParts = key.split("/");
                    if (routeParts.length != keyParts.length) {
                        continue;
                    }
                    var wildcardsMatch = key.match(new RegExp("{.*}", "g"));
                    if (wildcardsMatch) {
                        var numOfWildcards = wildcardsMatch.length;
                        for (var i = 1; i < numOfWildcards + 1; i++) {
                            var subroute = routeParts.slice(0, routeParts.length - i).join("/");
                            var subrouteWild = Library.Utils.initArray(i, "/{.*}").join("");
                            var findKey = key.match(new RegExp(subroute + subrouteWild));
                            if (findKey) {
                                return key;
                            }
                        }
                    }
                }
                return undefined;
            };
            this.getRouteArguments = function (route, routeKey) {
                var resultObj = {};
                var routeParts = route.split("/");
                var routeKeyParts = routeKey.split("/");
                for (var i = 0; i < routeParts.length; i++) {
                    if (routeKeyParts[i].match(/\{.*\}/g)) {
                        resultObj[routeKeyParts[i].replace("{", "").replace("}", "")] = routeParts[i];
                    }
                }
                return resultObj;
            };
            this.bootstrap();
        }
        return Router;
    }());
    Library.Router = Router;
})(Library || (Library = {}));
/// <reference path="../_references.ts" />
var Library;
(function (Library) {
    var Templater = (function () {
        function Templater() {
            var _this = this;
            this.templatesPath = "";
            this.blocks = [];
            this.templates = [];
            this.templatesData = [];
            this.prevBlocksCount = 0;
            this.interpolationRules = [];
            this.bootstrap = function () {
                _this.setTemplatesDirectory("templates");
            };
            this.setTemplatesDirectory = function (dir) {
                _this.templatesPath = dir;
            };
            this.work = function () {
                var self = _this;
                self.scanBlocks();
                self.scanTemplates();
                var hadAny = self.preloadTemplates(function () {
                    if (hadAny) {
                        self.work();
                        return;
                    }
                    self.scanBlocks();
                    self.scanTemplates();
                    self.injectTemplates();
                });
            };
            this.template = function (name, variables) {
                var self = _this;
                self.templatesData[name] = variables;
            };
            this.addInterpolationRule = function (callback) {
                _this.interpolationRules.push(callback);
            };
            this.scanBlocks = function () {
                _this.scanByTagName(_this.blocks, "block");
            };
            this.scanTemplates = function () {
                _this.scanByTagName(_this.templates, "template");
            };
            this.scanByTagName = function (container, tagName) {
                for (var i in container) {
                    if (!container[i].parentNode) {
                        delete container[i];
                    }
                }
                var elements = document.getElementsByTagName(tagName);
                for (var i = 0; i < elements.length; i++) {
                    var name_1 = elements[i].getAttribute("name");
                    container[name_1] = elements[i];
                }
            };
            this.preloadTemplates = function (onLoadAll) {
                var countLoaded = 0;
                var shouldLoad = 0;
                for (var name_2 in _this.blocks) {
                    var templateExists = _this.templates[name_2] != undefined;
                    if (!templateExists) {
                        shouldLoad++;
                        var path = "templates/" + name_2 + ".html";
                        Library.Utils.loadFile(path, function (data) {
                            var elTemplateParent = document.createElement("div");
                            elTemplateParent.innerHTML = data;
                            var elTemplate = elTemplateParent.firstChild;
                            document.body.appendChild(elTemplate);
                            countLoaded++;
                            if (shouldLoad == countLoaded) {
                                onLoadAll();
                            }
                        }, undefined);
                    }
                }
                if (shouldLoad == 0) {
                    onLoadAll();
                    return false;
                }
                return true;
            };
            this.injectTemplates = function () {
                var self = _this;
                for (var i in self.blocks) {
                    var name_3 = i;
                    var elBlock = self.blocks[name_3];
                    var elTemplate = self.templates[name_3];
                    var templateData = self.templatesData[name_3];
                    if (elBlock && elTemplate) {
                        for (var j in self.interpolationRules) {
                            self.interpolationRules[j](elTemplate, templateData);
                        }
                        self.replaceHtml(elBlock, elTemplate);
                    }
                }
            };
            this.replaceHtml = function (elBlock, elTemplate) {
                var elTemplateSubstituteNode = document.createElement("div");
                elTemplateSubstituteNode.innerHTML = elTemplate.innerHTML;
                var nodes = elTemplateSubstituteNode.childNodes;
                for (var i = 0; i < nodes.length; i++) {
                    var node = nodes[i];
                    if (node.nodeName == "SCRIPT") {
                        var scriptTag = document.createElement("script");
                        scriptTag.innerHTML = node.innerHTML;
                        elBlock.parentElement.insertBefore(scriptTag, elBlock);
                    }
                    else if (nodes[i].nodeName == "#text") {
                        var textNode = document.createTextNode(node.textContent);
                        elBlock.parentElement.insertBefore(textNode, elBlock);
                    }
                    else {
                        elBlock.parentElement.insertBefore(node, elBlock);
                    }
                }
                elBlock.remove();
                elTemplate.remove();
            };
            this.bootstrap();
            DefaultInterpolationRules.init(this);
        }
        return Templater;
    }());
    Library.Templater = Templater;
    var DefaultInterpolationRules = (function () {
        function DefaultInterpolationRules() {
        }
        DefaultInterpolationRules.init = function (templater) {
            templater.addInterpolationRule(DefaultInterpolationRules.renderFieldsRule);
            templater.addInterpolationRule(DefaultInterpolationRules.foreachRule);
        };
        DefaultInterpolationRules.renderFieldsRule = function (elTemplate, templateData) {
            var flatData = Library.Utils.flattenJSON(templateData);
            for (var field in flatData) {
                var value = flatData[field];
                elTemplate.innerHTML = elTemplate.innerHTML.replace(new RegExp("{{\\s*" + Library.Utils.camelToKebabCase(field) + "\\s*}}", 'g'), value);
            }
        };
        DefaultInterpolationRules.foreachRule = function (elTemplate, templateData) {
            var patternRegex = new RegExp("{{\\s*for .* in .*\\s*}}(.|\\n|\\r)*{{\\s*endfor\\s*}}", 'g');
            var arrayVarRegex = new RegExp("{{\\s*for .* in (.*)\\s*}}(.|\\n|\\r)*{{\\s*endfor\\s*}}", 'g');
            var objVarRegex = new RegExp("{{\\s*for (.*) in .*\\s*}}(.|\\n|\\r)*{{\\s*endfor\\s*}}", 'g');
            var repeatableHtmlRegex = new RegExp("{{\\s*for .* in .*\\s*}}((.|\\n|\\r)*){{\\s*endfor\\s*}}", 'g');
            var foreachMatches = elTemplate.innerHTML.match(patternRegex);
            for (var m in foreachMatches) {
                var resultHtml = "";
                var foreachTemplate = foreachMatches[m];
                var arrayVar = foreachTemplate.replace(arrayVarRegex, "$1");
                var objVar = foreachTemplate.replace(objVarRegex, "$1");
                var repeatableHtml = foreachTemplate.replace(repeatableHtmlRegex, "$1");
                for (var i in templateData[arrayVar]) {
                    var objVarData = templateData[arrayVar][i];
                    var rowHtml = repeatableHtml;
                    for (var field in templateData[arrayVar][i]) {
                        rowHtml = rowHtml.replace(new RegExp("{{\\s*" + objVar + "." + Library.Utils.camelToKebabCase(field) + "\\s*}}", 'g'), templateData[arrayVar][i][field]);
                    }
                    resultHtml += rowHtml;
                }
                elTemplate.innerHTML = elTemplate.innerHTML.replace(foreachTemplate, resultHtml);
            }
        };
        return DefaultInterpolationRules;
    }());
})(Library || (Library = {}));
/// <reference path="../_references.ts" />
var Library;
(function (Library) {
    var Filer = (function () {
        function Filer() {
            var _this = this;
            this.cache = {};
            this.preloadFiles = function (files) {
                var self = _this;
                var _loop_1 = function(i) {
                    $.get(files[i]).done(function (data) {
                        self.cache[files[i]] = data;
                    });
                };
                for (var i in files) {
                    _loop_1(i);
                }
            };
            this.getFile = function (fileName) {
                var self = _this;
                if (!self.cache[fileName]) {
                    $.ajax({
                        method: "GET",
                        url: fileName,
                        async: false
                    }).done(function (data) {
                        self.cache[fileName] = data;
                    });
                }
                return self.cache[fileName];
            };
        }
        Filer.Current = function () {
            if (!Filer._current) {
                Filer._current = new Filer();
            }
            return Filer._current;
        };
        return Filer;
    }());
    Library.Filer = Filer;
})(Library || (Library = {}));
/// <reference path="../_references.ts" />
var Library;
(function (Library) {
    var Utils = (function () {
        function Utils() {
        }
        Utils.loadFile = function (fileName, callback, fail) {
            var data = Library.Filer.Current().getFile(fileName);
            if (data) {
                return callback(data);
            }
            else {
                return fail();
            }
        };
        Utils.initArray = function (size, fillChars) {
            var result = [];
            for (var i = 0; i < length; i++) {
                result.push(fillChars);
            }
            return result;
        };
        Utils.initArrayOrdered = function (size) {
            var result = [];
            for (var i = 0; i < size; i++) {
                result.push(i);
            }
            return result;
        };
        Utils.today = function (addDays, addMonths, addYears) {
            if (addDays === void 0) { addDays = 0; }
            if (addMonths === void 0) { addMonths = 0; }
            if (addYears === void 0) { addYears = 0; }
            var today = new Date();
            var desiredDate = new Date(today.getFullYear() + addYears, today.getMonth() + addMonths, today.getDate() + addDays, today.getHours(), today.getMinutes(), today.getSeconds());
            var dd = desiredDate.getDate();
            var mm = desiredDate.getMonth() + 1; //January is 0!
            var yyyy = desiredDate.getFullYear();
            var d = dd.toString();
            var m = mm.toString();
            if (dd < 10) {
                d = '0' + dd;
            }
            if (mm < 10) {
                m = '0' + mm;
            }
            return yyyy + '/' + m + '/' + d;
        };
        Utils.now = function (addSeconds, addMinutes, addHours, addDays, addMonths, addYears) {
            if (addSeconds === void 0) { addSeconds = 0; }
            if (addMinutes === void 0) { addMinutes = 0; }
            if (addHours === void 0) { addHours = 0; }
            if (addDays === void 0) { addDays = 0; }
            if (addMonths === void 0) { addMonths = 0; }
            if (addYears === void 0) { addYears = 0; }
            var today = new Date();
            var desiredDate = new Date(today.getFullYear() + addYears, today.getMonth() + addMonths, today.getDate() + addDays, today.getHours() + addHours, today.getMinutes() + addMinutes, today.getSeconds() + addSeconds);
            var ss = desiredDate.getSeconds();
            var min = desiredDate.getMinutes();
            var hh = desiredDate.getHours();
            var dd = desiredDate.getDate();
            var mm = desiredDate.getMonth() + 1; //January is 0!
            var yyyy = desiredDate.getFullYear();
            var d = dd.toString();
            var m = mm.toString();
            var h = hh.toString();
            var mi = min.toString();
            var s = ss.toString();
            if (dd < 10) {
                d = '0' + dd;
            }
            if (mm < 10) {
                m = '0' + mm;
            }
            if (dd < 10) {
                d = '0' + dd;
            }
            if (mm < 10) {
                m = '0' + mm;
            }
            if (hh < 10) {
                h = '0' + hh;
            }
            if (min < 10) {
                mi = '0' + min;
            }
            if (ss < 10) {
                s = '0' + ss;
            }
            return yyyy + '/' + m + '/' + d + " " + h + ":" + mi + ":" + s;
        };
        Utils.hashCode = function (str) {
            var hash = 0, i, chr, len;
            if (str.length === 0)
                return hash;
            for (i = 0, len = str.length; i < len; i++) {
                chr = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + chr;
                hash |= 0; // Convert to 32bit integer
            }
            return Math.abs(hash);
        };
        Utils.flattenJSON = function (data) {
            var result = {};
            function recurse(cur, prop) {
                if (Object(cur) !== cur) {
                    result[prop] = cur;
                }
                else if (Array.isArray(cur)) {
                    for (var i = 0, l = cur.length; i < l; i++)
                        recurse(cur[i], prop + "[" + i + "]");
                    if (l == 0)
                        result[prop] = [];
                }
                else {
                    var isEmpty = true;
                    for (var p in cur) {
                        isEmpty = false;
                        recurse(cur[p], prop ? prop + "." + p : p);
                    }
                    if (isEmpty && prop)
                        result[prop] = {};
                }
            }
            recurse(data, "");
            return result;
        };
        Utils.camelToKebabCase = function (str) {
            var result = "";
            for (var i = 0; i < str.length; i++) {
                if (str[i] >= 'A' && str[i] <= 'Z') {
                    result += "-" + str[i].toLowerCase();
                }
                else {
                    result += str[i];
                }
            }
            return result;
        };
        return Utils;
    }());
    Library.Utils = Utils;
})(Library || (Library = {}));
/// <reference path="../_references.ts" />
var Views;
(function (Views) {
    var Index = (function () {
        function Index() {
            var _this = this;
            this.boot = function () {
                _this.preloadFiles();
                _this.registerRoutes();
                _this.setQuoteOfTheDayTempalteData();
                _this.makeMenuReactive();
                Index.Router.onLoaded(Index.Templater.work);
            };
            this.preloadFiles = function () {
                Index.Filer.preloadFiles([
                    "home.html",
                    "movie-details.html",
                    "templates/movie-details-template.html",
                    "templates/quote-of-the-day.html",
                    "json/movies.json"
                ]);
            };
            this.registerRoutes = function () {
                Index.Router.defaultConvention(function (route) {
                    return route.trim("/") + ".html";
                });
                Index.Router.registerNotFound("errors/404.html");
                Index.Router.register("/", "home.html", Views.Home);
                Index.Router.register("/movie-details/{id}", "movie-details.html", Views.MovieDetails);
                Index.Router.register("/movies", "movies.html", Views.Movies);
            };
            this.setQuoteOfTheDayTempalteData = function () {
                var quoteOfTheDay = DB.QuotesDB.getQuoteOfTheDay();
                var movie = DB.MoviesDB.get(quoteOfTheDay.movieId);
                Views.Index.Templater.template("quote-card-template", {
                    "movie": {
                        "id": quoteOfTheDay.movieId,
                        "name": movie.title,
                        "cover-photo": movie.coverPhoto
                    },
                    "quote": {
                        "text": quoteOfTheDay.text,
                        "likes": parseInt((Math.random() * 100000).toString())
                    }
                });
            };
            this.makeMenuReactive = function () {
                Index.Router.onLoading(function (route) {
                    $("nav a").removeClass("active");
                    $("nav a[href*='" + route + "']").addClass("active");
                });
            };
        }
        Index.Templater = new Library.Templater();
        Index.Router = new Library.Router();
        Index.Filer = Library.Filer.Current();
        return Index;
    }());
    Views.Index = Index;
})(Views || (Views = {}));
/// <reference path="../_references.ts" />
var Views;
(function (Views) {
    var Home = (function () {
        function Home() {
        }
        Home.beforeLoad = function (route, args) {
            var count = 3;
            var prev = [];
            var templateData = { movies: [] };
            for (var i = 1; i <= count; i++) {
                var quote = DB.QuotesDB.getRandomQuote(prev);
                if (quote) {
                    var movie = DB.MoviesDB.get(quote.movieId);
                    templateData["movies"].push({
                        "movie-id": movie.id,
                        "movie-title": movie.title,
                        "movie-cover-photo": movie.coverPhoto,
                        "quote-text": quote.text
                    });
                    prev.push(quote.id);
                }
            }
            Views.Index.Templater.template("quotes-template", templateData);
        };
        return Home;
    }());
    Views.Home = Home;
})(Views || (Views = {}));
/// <reference path="../_references.ts" />
var Views;
(function (Views) {
    var Movies = (function () {
        function Movies() {
        }
        Movies.beforeLoad = function (route, args) {
            Views.Index.Templater.template("movies-template", {
                "movies": DB.MoviesDB.all()
            });
        };
        return Movies;
    }());
    Views.Movies = Movies;
})(Views || (Views = {}));
/// <reference path="../_references.ts" />
var Views;
(function (Views) {
    var MovieDetails = (function () {
        function MovieDetails() {
        }
        MovieDetails.beforeLoad = function (route, args) {
            var movie = DB.MoviesDB.get(args.id);
            var quotes = DB.QuotesDB.getByMovie(args.id);
            Views.Index.Templater.template("movie-details-template", {
                "movie": movie,
                "quotes": quotes
            });
        };
        return MovieDetails;
    }());
    Views.MovieDetails = MovieDetails;
})(Views || (Views = {}));
/// <reference path="../_references.ts" />
var DB;
(function (DB) {
    var Movie = (function () {
        function Movie() {
        }
        return Movie;
    }());
    var MoviesDB = (function () {
        function MoviesDB() {
        }
        MoviesDB.all = function () {
            return Library.Filer.Current().getFile("json/movies.json");
        };
        MoviesDB.take = function (offset, take) {
            return MoviesDB.all().slice(offset, offset + take);
        };
        MoviesDB.get = function (id) {
            id = parseInt(id.toString());
            return Enumerable.From(MoviesDB.all()).Single(function (x) { return x.id == id; });
        };
        MoviesDB.getMovieOfTheDay = function () {
            var movies = MoviesDB.all();
            var previous = LocalStorageMovies.getPreviousMovies();
            var current = LocalStorageMovies.getCurrentMovie();
            if (!current) {
                var hash = Library.Utils.hashCode(Library.Utils.now()) % movies.length;
                LocalStorageMovies.setCurrentMovie(hash, Library.Utils.today(), Library.Utils.today(1));
                return MoviesDB.get(hash);
            }
            if (current.dateFrom <= Library.Utils.now() && current.dateTo >= Library.Utils.now()) {
                return MoviesDB.get(current.id);
            }
            else {
                LocalStorageMovies.addPreviousMovie(current.id, current.dateFrom, current.dateTo);
                if (previous.length == movies.length) {
                    LocalStorageMovies.resetPreviousMovies();
                }
                var prevIds = Enumerable.From(previous).Select(function (x) { return x.id; });
                var movieIds = Library.Utils.initArrayOrdered(movies.length);
                var notSeen = Enumerable.From(movieIds).Except(prevIds).ToArray();
                var hash = Library.Utils.hashCode(Library.Utils.now()) % notSeen.length;
                LocalStorageMovies.setCurrentMovie(hash, Library.Utils.today(), Library.Utils.today(1));
                return MoviesDB.get(hash);
            }
        };
        return MoviesDB;
    }());
    DB.MoviesDB = MoviesDB;
    var LocalStorageMovies = (function () {
        function LocalStorageMovies() {
        }
        LocalStorageMovies.getPreviousMovies = function () {
            var moviesJson = localStorage["previousMovies"];
            var movies = [];
            if (moviesJson) {
                movies = JSON.parse(moviesJson);
            }
            return movies;
        };
        LocalStorageMovies.addPreviousMovie = function (id, dateFrom, dateTo) {
            var movies = LocalStorageMovies.getPreviousMovies();
            id = parseInt(id.toString());
            movies.push({ id: id, dateFrom: dateFrom, dateTo: dateTo });
            localStorage["previousMovies"] = JSON.stringify(movies);
        };
        LocalStorageMovies.resetPreviousMovies = function () {
            localStorage["previousMovies"] = JSON.stringify([]);
        };
        LocalStorageMovies.getCurrentMovie = function () {
            var movie = localStorage["currentMovie"];
            return movie ? JSON.parse(movie) : undefined;
        };
        LocalStorageMovies.setCurrentMovie = function (id, dateFrom, dateTo) {
            id = parseInt(id.toString());
            localStorage["currentMovie"] = JSON.stringify({ id: id, dateFrom: dateFrom, dateTo: dateTo });
        };
        return LocalStorageMovies;
    }());
})(DB || (DB = {}));
/// <reference path="../_references.ts" />
var DB;
(function (DB) {
    var Quote = (function () {
        function Quote() {
        }
        return Quote;
    }());
    var QuotesDB = (function () {
        function QuotesDB() {
        }
        QuotesDB.all = function () {
            return Library.Filer.Current().getFile("json/quotes.json");
        };
        QuotesDB.take = function (offset, take) {
            return QuotesDB.all().slice(offset, offset + take);
        };
        QuotesDB.get = function (id) {
            id = parseInt(id.toString());
            return Enumerable.From(QuotesDB.all()).Single(function (x) { return x.id == id; });
        };
        QuotesDB.getByMovie = function (movieId) {
            movieId = parseInt(movieId.toString());
            return Enumerable.From(QuotesDB.all()).Where(function (x) { return x.movieId == movieId; }).ToArray();
        };
        QuotesDB.getQuoteOfTheDay = function () {
            var quotes = QuotesDB.all();
            var previous = LocalStorageQuotes.getPreviousQuotes();
            var current = LocalStorageQuotes.getCurrentQuote();
            if (!current) {
                var hash = Library.Utils.hashCode(Library.Utils.now()) % quotes.length;
                LocalStorageQuotes.setCurrentQuote(hash, Library.Utils.today(), Library.Utils.today(1));
                return QuotesDB.get(hash);
            }
            if (current.dateFrom <= Library.Utils.now() && current.dateTo >= Library.Utils.now()) {
                return QuotesDB.get(current.id);
            }
            else {
                LocalStorageQuotes.addPreviousQuote(current.id, current.dateFrom, current.dateTo);
                if (previous.length == quotes.length) {
                    LocalStorageQuotes.resetPreviousQuotes();
                }
                var prevIds = Enumerable.From(previous).Select(function (x) { return x.id; });
                var quoteIds = Library.Utils.initArrayOrdered(quotes.length);
                var notSeen = Enumerable.From(quoteIds).Except(prevIds).ToArray();
                var hash = Library.Utils.hashCode(Library.Utils.now()) % notSeen.length;
                LocalStorageQuotes.setCurrentQuote(hash, Library.Utils.today(), Library.Utils.today(1));
                return QuotesDB.get(notSeen[hash]);
            }
        };
        QuotesDB.getRandomQuote = function (notIn) {
            if (notIn === void 0) { notIn = []; }
            var quotes = QuotesDB.all();
            var quoteIds = Library.Utils.initArrayOrdered(quotes.length);
            var notSeen = Enumerable.From(quoteIds).Except(notIn).ToArray();
            if (notSeen.length == 0)
                return undefined;
            var hash = Library.Utils.hashCode(Library.Utils.now()) % notSeen.length;
            return QuotesDB.get(notSeen[hash]);
        };
        return QuotesDB;
    }());
    DB.QuotesDB = QuotesDB;
    var LocalStorageQuotes = (function () {
        function LocalStorageQuotes() {
        }
        LocalStorageQuotes.getPreviousQuotes = function () {
            var quotesJson = localStorage["previousQuotes"];
            var quotes = [];
            if (quotesJson) {
                quotes = JSON.parse(quotesJson);
            }
            return quotes;
        };
        LocalStorageQuotes.addPreviousQuote = function (id, dateFrom, dateTo) {
            var quotes = LocalStorageQuotes.getPreviousQuotes();
            id = parseInt(id.toString());
            quotes.push({ id: id, dateFrom: dateFrom, dateTo: dateTo });
            localStorage["previousQuotes"] = JSON.stringify(quotes);
        };
        LocalStorageQuotes.resetPreviousQuotes = function () {
            localStorage["previousQuotes"] = JSON.stringify([]);
        };
        LocalStorageQuotes.getCurrentQuote = function () {
            var quote = localStorage["currentQuote"];
            return quote ? JSON.parse(quote) : undefined;
        };
        LocalStorageQuotes.setCurrentQuote = function (id, dateFrom, dateTo) {
            id = parseInt(id.toString());
            localStorage["currentQuote"] = JSON.stringify({ id: id, dateFrom: dateFrom, dateTo: dateTo });
        };
        return LocalStorageQuotes;
    }());
})(DB || (DB = {}));
/// <reference path="../../typings/tsd.d.ts" />
/// <reference path="libs/router.ts" />
/// <reference path="libs/templater.ts" />
/// <reference path="libs/filer.ts" />
/// <reference path="libs/utils.ts" />
/// <reference path="views/index.ts" />
/// <reference path="views/home.ts" />
/// <reference path="views/movies.ts" />
/// <reference path="views/movie-details.ts" />
/// <reference path="db/movies.ts" />
/// <reference path="db/quotes.ts" /> 
