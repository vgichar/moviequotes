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
                        self.onLoadingCallbacks[i]();
                    }
                    Library.Utils.loadFile(view, function (childViewHtml) {
                        if (entry.beforeLoad) {
                            entry.beforeLoad(route, args);
                        }
                        for (var i in rtViews) {
                            rtViews[i].className = rtViews[i].className ? rtViews[i].className.replace("loading", "") : "";
                            rtViews[i].className += "loaded";
                            rtViews[i].innerHTML = childViewHtml;
                        }
                        document.body.className = document.body.className ? document.body.className.replace("loading", "") : "";
                        document.body.className += "loaded";
                        for (var i in self.onLoadedCallbacks) {
                            self.onLoadedCallbacks[i]();
                        }
                        if (entry.afterLoad) {
                            entry.afterLoad(route, args);
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
            this.register = function (route, view, beforeLoad, afterLoad) {
                if (beforeLoad === void 0) { beforeLoad = undefined; }
                if (afterLoad === void 0) { afterLoad = undefined; }
                route = _this.prepRouteForQuerying(route);
                _this.routeMap[route] = { view: view, beforeLoad: beforeLoad, afterLoad: afterLoad, route: route };
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
                    self.setVariablesAsAttributes();
                    self.injectTemplates();
                });
            };
            this.template = function (name, variables) {
                var self = _this;
                self.templatesData[name] = self.flattenJSON(variables);
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
            this.setVariablesAsAttributes = function () {
                for (var i in _this.templatesData) {
                    var variables = _this.templatesData[i];
                    var block = _this.blocks[i];
                    if (block) {
                        for (var v in variables) {
                            block.setAttribute(v.replace(".", "-"), variables[v]);
                        }
                    }
                }
            };
            this.injectTemplates = function () {
                var self = _this;
                for (var i in self.blocks) {
                    var name_3 = i;
                    var elBlock = self.blocks[name_3];
                    var elTemplate = self.templates[name_3];
                    if (elBlock && elTemplate) {
                        self.replaceVariables(elBlock, elTemplate);
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
            this.replaceVariables = function (elBlock, elTemplate) {
                var attrs = elBlock.attributes;
                for (var i = 0; i < attrs.length; i++) {
                    elTemplate.innerHTML = elTemplate.innerHTML.replace(new RegExp("{{" + attrs[i].name.replace("-", ".") + "}}", 'g'), attrs[i].value);
                }
            };
            this.flattenJSON = function (data) {
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
            this.bootstrap();
        }
        return Templater;
    }());
    Library.Templater = Templater;
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
        Utils.today = function () {
            var today = new Date();
            var dd = today.getDate();
            var mm = today.getMonth() + 1; //January is 0!
            var yyyy = today.getFullYear();
            var d = dd.toString();
            var m = mm.toString();
            if (dd < 10) {
                d = '0' + dd;
            }
            if (mm < 10) {
                m = '0' + mm;
            }
            return d + '/' + m + '/' + yyyy;
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
        return Utils;
    }());
    Library.Utils = Utils;
})(Library || (Library = {}));
/// <reference path="../_references.ts" />
var Views;
(function (Views) {
    var Home = (function () {
        function Home() {
        }
        Home.onBeforeLoad = function (route, args) {
            var movies = DB.MoviesDB.getMovieOfTheDay();
            console.log(movies);
            Views.Index.Templater.template("quote-of-the-day", {
                "movie.id": 45,
                "movie.name": "Fight club",
                "movie.year": 1999,
                "quote.text": "First",
                "quote.when": "150"
            });
        };
        return Home;
    }());
    Views.Home = Home;
})(Views || (Views = {}));
/// <reference path="../_references.ts" />
var Views;
(function (Views) {
    var Index = (function () {
        function Index() {
            this.boot = function () {
                Index.Templater = new Library.Templater();
                Index.Router = new Library.Router();
                Index.Filer = Library.Filer.Current();
                Index.Filer.preloadFiles([
                    "home.html",
                    "movie-details.html",
                    "templates/movie-details-template.html",
                    "templates/quote-of-the-day.html",
                    "json/movies.json"
                ]);
                Index.Router.register("/", "home.html", Views.Home.onBeforeLoad);
                Index.Router.register("/movie-details/{id}", "movie-details.html", function (route, args) {
                    Views.Index.Templater.template("movie-details-template", {
                        "movie.name": "Fight club"
                    });
                });
                Index.Router.registerNotFound("errors/404.html");
                Index.Router.defaultConvention(function (route) {
                    return route.trim("/") + ".html";
                });
                Index.Router.onLoaded(Index.Templater.work);
            };
        }
        return Index;
    }());
    Views.Index = Index;
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
            return MoviesDB.all()[id];
        };
        MoviesDB.getMovieOfTheDay = function () {
            var movies = MoviesDB.all();
            var previous = LocalStorageMovies.getPreviousMoviesOfTheDay();
            var current = LocalStorageMovies.getCurrentMovieOfTheDay();
            if (!current) {
                var hash = Library.Utils.hashCode(Library.Utils.today()) % movies.length;
                LocalStorageMovies.setCurrentMovieOfTheDay(hash);
                return MoviesDB.get(hash);
            }
            if (current.date == Library.Utils.today()) {
                return MoviesDB.get(current.id);
            }
            else {
                LocalStorageMovies.addPreviousMovieOfTheDay(current.id, current.date);
                if (previous.length == movies.length) {
                    LocalStorageMovies.resetPreviousMoviesOfTheDay();
                }
                var prevIds = Enumerable.From(previous).Select(function (x) { return x.id; });
                var movieIds = Library.Utils.initArrayOrdered(movies.length);
                var notSeen = Enumerable.From(movieIds).Except(prevIds).ToArray();
                var hash = Library.Utils.hashCode(Library.Utils.today()) % notSeen.length;
                LocalStorageMovies.setCurrentMovieOfTheDay(hash);
                return MoviesDB.get(hash);
            }
        };
        return MoviesDB;
    }());
    DB.MoviesDB = MoviesDB;
    var LocalStorageMovies = (function () {
        function LocalStorageMovies() {
        }
        LocalStorageMovies.getPreviousMoviesOfTheDay = function () {
            var moviesJson = localStorage["previousMoviesOfTheDay"];
            var movies = [];
            if (moviesJson) {
                movies = JSON.parse(moviesJson);
            }
            return movies;
        };
        LocalStorageMovies.addPreviousMovieOfTheDay = function (id, date) {
            var movies = LocalStorageMovies.getPreviousMoviesOfTheDay();
            id = parseInt(id.toString());
            movies.push({ id: id, date: date });
            localStorage["previousMoviesOfTheDay"] = JSON.stringify(movies);
        };
        LocalStorageMovies.resetPreviousMoviesOfTheDay = function () {
            localStorage["previousMoviesOfTheDay"] = JSON.stringify([]);
        };
        LocalStorageMovies.getCurrentMovieOfTheDay = function () {
            var movie = localStorage["currentMovieOfTheDay"];
            return movie ? JSON.parse(movie) : undefined;
        };
        LocalStorageMovies.setCurrentMovieOfTheDay = function (id) {
            id = parseInt(id.toString());
            localStorage["currentMovieOfTheDay"] = JSON.stringify({ id: id, date: Library.Utils.today() });
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
    var QoutesDB = (function () {
        function QoutesDB() {
            this.all = function () {
            };
            this.take = function (offset, take) {
            };
            this.get = function (id) {
            };
            this.getByMovie = function (movieId) {
            };
            this.getQuoteOfTheDay = function () {
            };
        }
        return QoutesDB;
    }());
    DB.QoutesDB = QoutesDB;
    var LocalStorageQuotes = (function () {
        function LocalStorageQuotes() {
            this.getPreviousQuotesOfTheDay = function () {
            };
            this.getCurrentQuoteOfTheDay = function () {
            };
            this.setCurrentQuoteOfTheDay = function (quote) {
            };
        }
        return LocalStorageQuotes;
    }());
})(DB || (DB = {}));
/// <reference path="../../typings/tsd.d.ts" />
/// <reference path="libs/router.ts" />
/// <reference path="libs/templater.ts" />
/// <reference path="libs/filer.ts" />
/// <reference path="libs/utils.ts" />
/// <reference path="views/home.ts" />
/// <reference path="views/index.ts" />
/// <reference path="db/movies.ts" />
/// <reference path="db/quotes.ts" /> 
