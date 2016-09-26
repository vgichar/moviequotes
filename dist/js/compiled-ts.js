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
                var hadAny = self.preloadTemplates(function () {
                    if (hadAny) {
                        self.work();
                        return;
                    }
                    self.scanBlocks();
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
                var self = _this;
                var countLoaded = 0;
                var shouldLoad = 0;
                var _loop_1 = function(name_2) {
                    shouldLoad++;
                    var path = "templates/" + name_2 + ".html";
                    Library.Utils.loadFile(path, function (data) {
                        var elTemplateParent = document.createElement("div");
                        elTemplateParent.innerHTML = data;
                        var elTemplate = elTemplateParent.firstChild;
                        document.body.appendChild(elTemplate);
                        self.templates[name_2] = elTemplate;
                        countLoaded++;
                        if (shouldLoad == countLoaded) {
                            onLoadAll();
                        }
                    }, undefined);
                };
                for (var name_2 in _this.blocks) {
                    _loop_1(name_2);
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
                        elTemplate.innerHTML = self.interpolate(elTemplate.innerHTML, templateData);
                        self.replaceHtml(elBlock, elTemplate);
                    }
                }
            };
            this.interpolate = function (html, data) {
                for (var j in _this.interpolationRules) {
                    html = _this.interpolationRules[j](html, data);
                }
                return html;
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
            DefaultInterpolationRules.templater = templater;
            templater.addInterpolationRule(DefaultInterpolationRules.renderFieldsRule);
            templater.addInterpolationRule(DefaultInterpolationRules.foreachRule);
            templater.addInterpolationRule(DefaultInterpolationRules.ifElseRule);
            templater.addInterpolationRule(DefaultInterpolationRules.renderAnythingRule);
        };
        DefaultInterpolationRules.renderFieldsRule = function (html, templateData) {
            var scope = new Scope(templateData);
            var flatData = scope.getFlatData();
            for (var field in flatData) {
                var value = flatData[field];
                html = html.replace(new RegExp("{{\\s*" + Library.Utils.escapeRegExp(field) + "\\s*}}", 'g'), value);
            }
            return html;
        };
        DefaultInterpolationRules.foreachRule = function (html, templateData) {
            var regex = new RegExp("{{\\s*for (.*) in (.*)\\s*}}((.|\\n|\\r)*){{\\s*endfor\\s*}}", 'g');
            var foreachMatches = html.match(regex);
            for (var m in foreachMatches) {
                var resultHtml = "";
                var foreachTemplate = foreachMatches[m];
                var objVar = foreachTemplate.replace(regex, "$1"); // example quote // scope temp
                var arrayVar = foreachTemplate.replace(regex, "$2"); // example movie.quotes
                var repeatableHtml = foreachTemplate.replace(regex, "$3"); // example {{quote.text}}
                var scope = new Scope(templateData);
                var arr = scope.getValue(arrayVar);
                var counter = 0;
                for (var i in arr) {
                    scope.setValue(objVar, arr[i]);
                    scope.setValue("$index", counter);
                    scope.setValue("$index1", counter + 1);
                    counter++;
                    resultHtml += DefaultInterpolationRules.templater.interpolate(repeatableHtml, scope.getData());
                    scope.unsetValue(objVar);
                    scope.unsetValue("$index");
                    scope.unsetValue("$index1");
                }
                html = html.replace(foreachTemplate, resultHtml);
            }
            return html;
        };
        DefaultInterpolationRules.ifElseRule = function (html, templateData) {
            var ifEndifRegion = new RegExp("{{\\s*if\\s*(.*)\\s*}}((.|\\n|\\r)*){{\\s*endif\\s*}}", 'g');
            var elseRegex = new RegExp("{{\\s*else\\s*}}", 'g');
            var matches = html.match(ifEndifRegion);
            var scope = new Scope(templateData);
            for (var m in matches) {
                var match = matches[m];
                var hasElse = match.match(elseRegex).length > 0;
                var condition = match.replace(ifEndifRegion, "$1");
                condition = Library.Utils.htmlEncode(condition);
                var block = match.replace(ifEndifRegion, "$2");
                var blocks = [block];
                if (hasElse) {
                    blocks = block.split(new RegExp("{{\\s*else\\s*}}", 'g'));
                }
                scope.makeGlobal();
                if (eval(condition)) {
                    html = html.replace(match, blocks[0]);
                }
                else if (blocks.length == 2) {
                    html = html.replace(match, blocks[1]);
                }
                else {
                    html = html.replace(match, "");
                }
                scope.makeLocal();
            }
            return html;
        };
        DefaultInterpolationRules.renderAnythingRule = function (html, templateData) {
            var regex = new RegExp("{{(.*)}}", 'g');
            var matches = html.match(regex);
            var scope = new Scope(templateData);
            scope.makeGlobal();
            for (var m in matches) {
                var match = matches[m];
                var code = match.replace(regex, "$1");
                html = html.replace(match, eval(code));
            }
            scope.makeLocal();
            return html;
        };
        return DefaultInterpolationRules;
    }());
    var Scope = (function () {
        function Scope(data) {
            this.data = data;
        }
        Scope.prototype.setValue = function (key, value) {
            this.gv(this.data, key, value);
        };
        Scope.prototype.unsetValue = function (key) {
            this.gvf(this.data, key, undefined);
        };
        Scope.prototype.getValue = function (key) {
            return this.gv(this.data, key);
        };
        Scope.prototype.getData = function () {
            return this.data;
        };
        Scope.prototype.getFlatData = function () {
            return Library.Utils.flattenJSON(this.data);
        };
        Scope.prototype.makeGlobal = function () {
            for (var i in this.data) {
                window[i] = this.data[i];
            }
        };
        Scope.prototype.makeLocal = function () {
            for (var i in this.data) {
                delete window[i];
            }
        };
        Scope.prototype.gv = function (d, k, v) {
            if (v === void 0) { v = undefined; }
            if (k.indexOf(".") >= 0) {
                var firstKey = k.split('.')[0];
                var newKey = k.substring(firstKey.length + 1, k.length);
                return this.gv(d[firstKey], newKey, v);
            }
            if (v != undefined) {
                d[k] = v;
            }
            return d[k];
        };
        Scope.prototype.gvf = function (d, k, v) {
            if (k.indexOf(".") >= 0) {
                var firstKey = k.split('.')[0];
                var newKey = k.substring(firstKey.length + 1, k.length);
                return this.gv(d[firstKey], newKey, v);
            }
            d[k] = v;
            return d[k];
        };
        return Scope;
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
                var _loop_2 = function(i) {
                    $.get(files[i]).done(function (data) {
                        self.cache[files[i]] = data;
                    });
                };
                for (var i in files) {
                    _loop_2(i);
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
        Utils.initArrayOrdered = function (size, startChar) {
            if (startChar === void 0) { startChar = 0; }
            var result = [];
            for (var i = 0; i < size; i++) {
                result.push(startChar + i);
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
                    var l = cur.length;
                    for (var i = 0; i < l; i++) {
                        recurse(cur[i], prop + "[" + i + "]");
                    }
                    if (l == 0) {
                        result[prop] = [];
                    }
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
        Utils.slugify = function (str) {
            return str
                .toLowerCase()
                .replace(/[^\w ]+/g, '')
                .replace(/ +/g, '-');
        };
        Utils.htmlEncode = function (str) {
            var el = document.createElement("div");
            el.innerHTML = str;
            return el.innerText;
        };
        Utils.escapeRegExp = function (str) {
            return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
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
                    "movies.html",
                    "movie-details.html",
                    "templates/movie-details-template.html",
                    "templates/movies-browse-template.html",
                    "templates/movies-template.html",
                    "templates/popular-movies-template.html",
                    "templates/quote-card-template.html",
                    "json/movies.json",
                    "json/popular-movies.json"
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
                Index.Router.register("/movies/{start}", "movies.html", Views.Movies);
            };
            this.setQuoteOfTheDayTempalteData = function () {
                var quoteOfTheDay = DB.QuotesDB.getQuoteOfTheDay();
                var movie = DB.MoviesDB.get(quoteOfTheDay.movieSlug);
                Views.Index.Templater.template("quote-card-template", {
                    "movie": {
                        "slug": quoteOfTheDay.movieSlug,
                        "name": movie.title,
                        "coverPhoto": movie.coverPhoto
                    },
                    "quote": {
                        "lines": quoteOfTheDay.lines,
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
            var templateData = {};
            var movies = DB.MoviesDB.getPopularMovies().ToArray();
            for (var i in movies) {
                movies[i]["quote"] = DB.QuotesDB.getByMovie(movies[i].slug).First();
            }
            templateData["movies"] = movies;
            Views.Index.Templater.template("popular-movies-template", templateData);
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
            var start = args.start;
            if (start) {
                Views.Index.Templater.template("movies-template", {
                    "movies": DB.MoviesDB.getByStart(start).ToArray()
                });
            }
            else {
                Views.Index.Templater.template("movies-template", {
                    "movies": DB.MoviesDB.all().ToArray()
                });
            }
            Views.Index.Templater.template("movies-browse-template", {
                "letters": Library.Utils.initArrayOrdered(26, 'A'.charCodeAt(0)).concat(Library.Utils.initArrayOrdered(10, '0'.charCodeAt(0)))
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
                "quotes": quotes.ToArray()
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
        function Movie(id, title, year, img) {
            this.id = id;
            this.title = title;
            this.year = year;
            if (img && img != null) {
                this.coverPhotoBase = img;
                this.coverPhoto = "https://images-na.ssl-images-amazon.com/images/M/" + img + "._V1_UX182_CR0,0,182,268_AL_.jpg";
                this.smallCoverPhoto = "https://images-na.ssl-images-amazon.com/images/M/" + img + "._V1_UX90_CR0,0,90,150_AL_.jpg";
                this.verySmallCoverPhoto = "https://images-na.ssl-images-amazon.com/images/M/" + img + "._V1_UX50_CR0,0,50,80_AL_.jpg";
            }
            else {
                this.coverPhotoBase = undefined;
                this.coverPhoto = "http://placehold.it/150x250";
                this.smallCoverPhoto = "http://placehold.it/100x150";
                this.verySmallCoverPhoto = "http://placehold.it/50x80";
            }
            this.slug = Library.Utils.slugify(title + " " + year);
        }
        return Movie;
    }());
    var MoviesDB = (function () {
        function MoviesDB() {
        }
        MoviesDB.all = function () {
            var movies = Library.Filer.Current().getFile("json/movies.json");
            return Enumerable.From(movies).Select(function (x) { return new Movie(x.id, x.title, x.year, x.img); });
        };
        MoviesDB.getByStart = function (str) {
            str = str.toLowerCase();
            return MoviesDB.all().Where(function (x) { return x.title.toLowerCase().indexOf(str) == 0; });
        };
        MoviesDB.take = function (offset, take) {
            return MoviesDB.all().slice(offset, offset + take);
        };
        MoviesDB.get = function (slug) {
            return MoviesDB.all().Single(function (x) { return x.slug == slug; });
        };
        MoviesDB.getMovieOfTheDay = function () {
            var movies = MoviesDB.all().ToArray();
            var previous = LocalStorageMovies.getPreviousMovies();
            var current = LocalStorageMovies.getCurrentMovie();
            if (!current) {
                var hash = Library.Utils.hashCode(Library.Utils.now()) % movies.length;
                LocalStorageMovies.setCurrentMovie(movies[hash].slug, Library.Utils.today(), Library.Utils.today(1));
                return movies[hash];
            }
            if (current.dateFrom <= Library.Utils.now() && current.dateTo >= Library.Utils.now()) {
                return MoviesDB.get(current.slug);
            }
            else {
                LocalStorageMovies.addPreviousMovie(current.slug, current.dateFrom, current.dateTo);
                if (previous.length == movies.length) {
                    LocalStorageMovies.resetPreviousMovies();
                }
                var prevIds = Enumerable.From(previous).Select(function (x) { return x.slug; });
                var movieIds = Library.Utils.initArrayOrdered(movies.length);
                var notSeen = Enumerable.From(movieIds).Except(prevIds).ToArray();
                var hash = Library.Utils.hashCode(Library.Utils.now()) % notSeen.length;
                LocalStorageMovies.setCurrentMovie(movies[hash], Library.Utils.today(), Library.Utils.today(1));
                return MoviesDB.get(hash);
            }
        };
        MoviesDB.getRandomMovie = function (notIn) {
            if (notIn === void 0) { notIn = []; }
            var notInEnum = Enumerable.From(notIn);
            var notSeenMovies = MoviesDB.all().Where(function (x) { return notInEnum.Any(function (y) { return y == x.slug; }); }).ToArray();
            if (notSeenMovies.length == 0)
                return undefined;
            var hash = Library.Utils.hashCode(Library.Utils.now()) % notSeenMovies.length;
            return MoviesDB.get(notSeenMovies[hash].slug);
        };
        MoviesDB.getPopularMovies = function () {
            var movies = Library.Filer.Current().getFile("json/popular-movies.json");
            return Enumerable.From(movies).Select(function (x) { return new Movie(x.id, x.title, x.year, x.img); });
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
        LocalStorageMovies.addPreviousMovie = function (slug, dateFrom, dateTo) {
            var movies = LocalStorageMovies.getPreviousMovies();
            movies.push({ slug: slug, dateFrom: dateFrom, dateTo: dateTo });
            localStorage["previousMovies"] = JSON.stringify(movies);
        };
        LocalStorageMovies.resetPreviousMovies = function () {
            localStorage["previousMovies"] = JSON.stringify([]);
        };
        LocalStorageMovies.getCurrentMovie = function () {
            var movie = localStorage["currentMovie"];
            return movie ? JSON.parse(movie) : undefined;
        };
        LocalStorageMovies.setCurrentMovie = function (slug, dateFrom, dateTo) {
            localStorage["currentMovie"] = JSON.stringify({ slug: slug, dateFrom: dateFrom, dateTo: dateTo });
        };
        return LocalStorageMovies;
    }());
})(DB || (DB = {}));
/// <reference path="../_references.ts" />
var DB;
(function (DB) {
    var Quote = (function () {
        function Quote(id, lines, movieSlug) {
            this.id = id++;
            this.lines = lines;
            this.movieSlug = movieSlug;
        }
        return Quote;
    }());
    var QuotesDB = (function () {
        function QuotesDB() {
        }
        QuotesDB.get = function (id, movieSlug) {
            id = parseInt(id.toString());
            return QuotesDB.getByMovie(movieSlug).Single(function (x) { return x.id == id; });
        };
        QuotesDB.getByMovie = function (movieSlug) {
            var movieQuotesObj = Library.Filer.Current().getFile("json/quotes/" + movieSlug + ".json");
            var movieQuotes = movieQuotesObj.quotes;
            var idx = 0;
            return Enumerable.From(movieQuotes).Select(function (x) { return new Quote(idx, x.lines, movieSlug); });
        };
        QuotesDB.getQuoteOfTheDay = function () {
            var movieOfTheDay = DB.MoviesDB.getMovieOfTheDay();
            var quotes = QuotesDB.getByMovie(movieOfTheDay.slug).ToArray();
            var previous = LocalStorageQuotes.getPreviousQuotes();
            var current = LocalStorageQuotes.getCurrentQuote();
            if (!current) {
                var hash = Library.Utils.hashCode(Library.Utils.now()) % quotes.length;
                LocalStorageQuotes.setCurrentQuote(hash, Library.Utils.today(), Library.Utils.today(1));
                return quotes[hash];
            }
            if (current.dateFrom <= Library.Utils.now() && current.dateTo >= Library.Utils.now()) {
                var hash = Library.Utils.hashCode(Library.Utils.now()) % quotes.length;
                return quotes[hash];
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
                return quotes[notSeen[hash]];
            }
        };
        QuotesDB.getRandomQuote = function (notIn) {
            if (notIn === void 0) { notIn = []; }
            var movie = DB.MoviesDB.getRandomMovie();
            if (movie == undefined || notIn[movie.slug] == true)
                return undefined;
            var quotes = QuotesDB.getByMovie(movie.slug);
            var quoteIds = Library.Utils.initArrayOrdered(quotes.length);
            var notSeen = Enumerable.From(quoteIds).Except(notIn).ToArray();
            var hash = Library.Utils.hashCode(Library.Utils.now()) % notSeen.length;
            return quotes[notSeen[hash]];
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
