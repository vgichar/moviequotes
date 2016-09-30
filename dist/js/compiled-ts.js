var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
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
            templater.addInterpolationRule(DefaultInterpolationRules.ifElseRule);
            templater.addInterpolationRule(DefaultInterpolationRules.foreachRule);
            templater.addInterpolationRule(DefaultInterpolationRules.renderFieldsRule);
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
            var startRegex = new RegExp("{{\\s*for (.*) in (.*)\\s*}}", 'g');
            var endRegex = new RegExp("{{\\s*endfor\\s*}}", 'g');
            return RuleUtil.scopefulRule(html, templateData, "for", "endfor", startRegex, endRegex, function (html, templateData, paddingFront, paddingBack) {
                var startPadded = "{{\\s*" + paddingFront + "for" + paddingBack + " (.*) in (.*)\\s*}}";
                var endPadded = "{{\\s*" + paddingFront + "endfor" + paddingBack + "\\s*}}";
                var contentWithLazyEnd = "(((.|\\n|\\r)(?!" + endPadded + "))*.)";
                var regex = new RegExp(startPadded + contentWithLazyEnd + endPadded, 'g');
                var scope = new Scope(templateData);
                var blockMatches = html.match(regex);
                for (var m in blockMatches) {
                    var resultHtml = "";
                    var match = blockMatches[m];
                    var objVar = match.replace(regex, "$1");
                    var arrayVar = match.replace(regex, "$2");
                    var repeatableHtml = match.replace(regex, "$3");
                    var arr = scope.getValue(arrayVar);
                    repeatableHtml = repeatableHtml.replace(new RegExp(objVar + "(?=(?!.*{{.*}}).*}})", 'g'), arrayVar + "[{{#}}]");
                    for (var k in arr) {
                        resultHtml += repeatableHtml.replace(/{{#}}/g, k);
                        resultHtml = resultHtml.replace(new RegExp("{{\\s*\\$index\\s*}}", 'g'), k);
                        resultHtml = resultHtml.replace(new RegExp("{{\\s*\\$index1\\s*}}", 'g'), (parseInt(k) + 1).toString());
                    }
                    html = html.replace(match, resultHtml);
                }
                return html;
            });
        };
        DefaultInterpolationRules.ifElseRule = function (html, templateData) {
            var startRegex = new RegExp("{{\\s*if\\s*(.*)\\s*}}", 'g');
            var endRegex = new RegExp("{{\\s*endif\\s*}}", 'g');
            var elseRegex = new RegExp("{{\\s*else\\s*}}", 'g');
            return RuleUtil.scopefulRule(html, templateData, "if", "endif", startRegex, endRegex, function (html, templateData, paddingFront, paddingBack) {
                var startPadded = "{{\\s*" + paddingFront + "if" + paddingBack + " (.*)\\s*}}";
                var endPadded = "{{\\s*" + paddingFront + "endif" + paddingBack + "\\s*}}";
                var contentWithLazyEnd = "(((.|\\n|\\r)(?!" + endPadded + "))*.)";
                var regex = new RegExp(startPadded + contentWithLazyEnd + endPadded, 'g');
                var scope = new Scope(templateData);
                var blockMatches = html.match(regex);
                for (var m in blockMatches) {
                    var match = blockMatches[m];
                    var hasElse = match.match(elseRegex);
                    hasElse = hasElse && hasElse != null && hasElse.length > 0;
                    var condition = match.replace(regex, "$1");
                    condition = Library.Utils.htmlEncode(condition);
                    var block = match.replace(regex, "$2");
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
            });
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
    var RuleUtil = (function () {
        function RuleUtil() {
        }
        RuleUtil.scopefulRule = function (html, templateData, startScopeWord, endScopeWord, startScopeRegex, endScopeRegex, logicCallback) {
            var originalHtml = html;
            var scope = new Scope(templateData);
            var regionMatches = html.match(new RegExp(startScopeRegex.source + "|" + endScopeRegex.source, 'g'));
            var level = 0;
            var levelStack = {};
            var max = 0;
            for (var m in regionMatches) {
                if (regionMatches[m].indexOf(endScopeWord) < 0) {
                    if (!levelStack[level]) {
                        levelStack[level] = 0;
                    }
                    html = html.replace(regionMatches[m], regionMatches[m].replace(startScopeWord, level + startScopeWord + levelStack[level]));
                    level++;
                    max = max < level ? level : max;
                }
                else {
                    level--;
                    html = html.replace(regionMatches[m], regionMatches[m].replace(endScopeWord, level + endScopeWord + levelStack[level]));
                    levelStack[level]++;
                }
            }
            for (var i = 0; i < max; i++) {
                for (var j = 0; j < levelStack[i]; j++) {
                    html = logicCallback(html, templateData, i, j);
                }
            }
            return html;
        };
        return RuleUtil;
    }());
    var Scope = (function () {
        function Scope(data) {
            this.data = data;
            this.cached = false;
        }
        Scope.prototype.setValue = function (key, value) {
            eval("this.data." + key + "=" + value);
            this.cached = false;
        };
        Scope.prototype.unsetValue = function (key) {
            eval("this.data." + key + "=undefined");
            this.cached = false;
        };
        Scope.prototype.getValue = function (key) {
            return eval("this.data." + key);
        };
        Scope.prototype.getData = function () {
            return this.data;
        };
        Scope.prototype.getFlatData = function () {
            if (this.cached)
                return this.flatData;
            this.flatData = Library.Utils.flattenJSON(this.data);
            this.cached = true;
            return this.flatData;
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
        Utils.unflattenJSON = function (data) {
            "use strict";
            if (Object(data) !== data || Array.isArray(data))
                return data;
            var regex = /\.?([^.\[\]]+)|\[(\d+)\]/g, resultholder = {};
            for (var p in data) {
                var cur = resultholder, prop = "", m;
                while (m = regex.exec(p)) {
                    cur = cur[prop] || (cur[prop] = (m[2] ? [] : {}));
                    prop = m[2] || m[1];
                }
                cur[prop] = data[p];
            }
            return resultholder[""] || resultholder;
        };
        Utils.slugify = function (str) {
            str = str
                .toLowerCase()
                .replace('\'', '-');
            return str.replace(/[^a-zA-Z0-9-\s]+/g, '')
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
var Controllers;
(function (Controllers) {
    var HomeController = (function () {
        function HomeController() {
        }
        HomeController.beforeLoad = function (route, args) {
            var movies = new DB.MoviesDB().getPopularMovies().ToArray();
            for (var i in movies) {
                movies[i]["quote"] = new DB.QuotesDB().getByMovie(movies[i].slug).First();
            }
            Controllers.IndexController.Templater.template("home--popular-movies", { movies: movies });
        };
        return HomeController;
    }());
    Controllers.HomeController = HomeController;
})(Controllers || (Controllers = {}));
/// <reference path="../_references.ts" />
var Controllers;
(function (Controllers) {
    var MoviesController = (function () {
        function MoviesController() {
        }
        MoviesController.beforeLoad = function (route, args) {
            var start = args.start;
            var moviesDB = new DB.MoviesDB();
            if (start) {
                Controllers.IndexController.Templater.template("movies--list", {
                    "movies": moviesDB.getByStart(start).Take(500).ToArray()
                });
            }
            else {
                Controllers.IndexController.Templater.template("movies--list", {
                    "movies": moviesDB.take(0, 500).ToArray()
                });
            }
            Controllers.IndexController.Templater.template("movies--browse", {
                "letters": Library.Utils.initArrayOrdered(26, 'A'.charCodeAt(0)).concat(Library.Utils.initArrayOrdered(10, '0'.charCodeAt(0)))
            });
        };
        return MoviesController;
    }());
    Controllers.MoviesController = MoviesController;
})(Controllers || (Controllers = {}));
/// <reference path="../_references.ts" />
var Controllers;
(function (Controllers) {
    var MovieDetailsController = (function () {
        function MovieDetailsController() {
        }
        MovieDetailsController.beforeLoad = function (route, args) {
            var movie = new DB.MoviesDB().get(args.id);
            var quotes = new DB.QuotesDB().getByMovie(args.id);
            Controllers.IndexController.Templater.template("movie-details--list-quotes", {
                "movie": movie,
                "quotes": quotes.ToArray()
            });
        };
        return MovieDetailsController;
    }());
    Controllers.MovieDetailsController = MovieDetailsController;
})(Controllers || (Controllers = {}));
/// <reference path="../_references.ts" />
var DB;
(function (DB) {
    var BaseModel = (function () {
        function BaseModel(id) {
            this.id = id;
        }
        return BaseModel;
    }());
    DB.BaseModel = BaseModel;
    var BaseDB = (function () {
        function BaseDB(file) {
            this.file = file;
        }
        BaseDB.prototype.all = function () {
            var movies = Library.Filer.Current().getFile(this.file);
            return Enumerable.From(movies);
        };
        BaseDB.prototype.getPopularContent = function () {
            var content = Library.Filer.Current().getFile("json/popular-content.json");
            return content;
        };
        return BaseDB;
    }());
    DB.BaseDB = BaseDB;
})(DB || (DB = {}));
/// <reference path="../_references.ts" />
var DB;
(function (DB) {
    var MovieModel = (function (_super) {
        __extends(MovieModel, _super);
        function MovieModel(id, title, year, img) {
            _super.call(this, id);
            this.title = title;
            this.year = year;
            this.coverPhoto = this.resizeImage(img, 182, 268);
            this.smallCoverPhoto = this.resizeImage(img, 120, 175);
            this.verySmallCoverPhoto = this.resizeImage(img, 90, 130);
            this.slug = Library.Utils.slugify(title + " " + year);
        }
        MovieModel.prototype.resizeImage = function (img, w, h) {
            if (img && img != null) {
                console.log(img, w, h);
                return img.replace("UX182", "UX" + w).replace(",182", "," + w).replace(",268", "," + h);
            }
            else {
                return "http://placehold.it/" + w + "x" + h;
            }
        };
        return MovieModel;
    }(DB.BaseModel));
    var MoviesDB = (function (_super) {
        __extends(MoviesDB, _super);
        function MoviesDB() {
            _super.call(this, "json/movies.json");
        }
        MoviesDB.prototype.all = function () {
            var all = _super.prototype.all.call(this).Select(function (x) { return new MovieModel(x.id, x.title, x.year, x.img); });
            return all;
        };
        MoviesDB.prototype.getByStart = function (str) {
            str = str.toLowerCase();
            return this.all().Where(function (x) { return x.title.toLowerCase().indexOf(str) == 0; });
        };
        MoviesDB.prototype.take = function (offset, take) {
            return this.all().Skip(offset).Take(take);
        };
        MoviesDB.prototype.get = function (slug) {
            return this.all().Single(function (x) { return x.slug == slug; });
        };
        MoviesDB.prototype.getMovieOfTheDay = function () {
            var content = this.getPopularContent();
            var movie = content['movie-of-the-day'];
            return new MovieModel(movie.id, movie.title, movie.year, movie.img);
        };
        MoviesDB.prototype.getPopularMovies = function () {
            var content = this.getPopularContent();
            var movies = content['popular-movies'];
            return Enumerable.From(movies).Select(function (x) { return new MovieModel(x.id, x.title, x.year, x.img); });
        };
        MoviesDB.prototype.getRandomMovie = function (notIn) {
            if (notIn === void 0) { notIn = []; }
            var notInEnum = Enumerable.From(notIn);
            var notSeenMovies = this.all().Where(function (x) { return notInEnum.Any(function (y) { return y == x.slug; }); }).ToArray();
            if (notSeenMovies.length == 0)
                return undefined;
            var hash = Library.Utils.hashCode(Library.Utils.now()) % notSeenMovies.length;
            return this.get(notSeenMovies[hash].slug);
        };
        return MoviesDB;
    }(DB.BaseDB));
    DB.MoviesDB = MoviesDB;
})(DB || (DB = {}));
/// <reference path="../_references.ts" />
var DB;
(function (DB) {
    var QuoteModel = (function (_super) {
        __extends(QuoteModel, _super);
        function QuoteModel(id, lines, movieSlug) {
            _super.call(this, id++);
            this.lines = lines;
            this.movieSlug = movieSlug;
        }
        return QuoteModel;
    }(DB.BaseModel));
    var QuotesDB = (function (_super) {
        __extends(QuotesDB, _super);
        function QuotesDB() {
            _super.call(this, "");
        }
        QuotesDB.prototype.get = function (id, movieSlug) {
            id = parseInt(id.toString());
            return this.getByMovie(movieSlug).Single(function (x) { return x.id == id; });
        };
        QuotesDB.prototype.getByMovie = function (movieSlug) {
            var movieQuotesObj = Library.Filer.Current().getFile("json/movie-quotes/" + movieSlug + ".json");
            var movieQuotes = movieQuotesObj.quotes;
            var idx = 0;
            return Enumerable.From(movieQuotes).Select(function (x) { return new QuoteModel(idx, x.lines, movieSlug); });
        };
        QuotesDB.prototype.getQuoteOfTheDay = function () {
            var content = this.getPopularContent();
            var quote = content['quote-of-the-day'];
            return new QuoteModel(quote.id, quote.lines, quote.slug);
        };
        QuotesDB.prototype.getRandomQuote = function (notIn) {
            if (notIn === void 0) { notIn = []; }
            var moviesDB = new DB.MoviesDB();
            var movie = moviesDB.getRandomMovie();
            if (movie == undefined || notIn[movie.slug] == true)
                return undefined;
            var quotes = this.getByMovie(movie.slug);
            var quoteIds = Library.Utils.initArrayOrdered(quotes.Count());
            var notSeen = Enumerable.From(quoteIds).Except(notIn).ToArray();
            var hash = Library.Utils.hashCode(Library.Utils.now()) % notSeen.length;
            return quotes[notSeen[hash]];
        };
        return QuotesDB;
    }(DB.BaseDB));
    DB.QuotesDB = QuotesDB;
})(DB || (DB = {}));
/// <reference path="../../typings/tsd.d.ts" />
/// <reference path="libs/router.ts" />
/// <reference path="libs/templater.ts" />
/// <reference path="libs/filer.ts" />
/// <reference path="libs/utils.ts" />
/// <reference path="IndexController.ts" />
/// <reference path="controllers/HomeController.ts" />
/// <reference path="controllers/MoviesController.ts" />
/// <reference path="controllers/MovieDetailsController.ts" />
/// <reference path="db/BaseDB.ts" />
/// <reference path="db/MoviesDB.ts" />
/// <reference path="db/QuotesDB.ts" /> 
/// <reference path="_references.ts" />
var Controllers;
(function (Controllers) {
    var IndexController = (function () {
        function IndexController() {
            var _this = this;
            this.boot = function () {
                _this.preloadFiles();
                _this.registerRoutes();
                _this.setQuoteOfTheDayTempalteData();
                _this.makeMenuReactive();
                IndexController.Router.onLoaded(IndexController.Templater.work);
            };
            this.preloadFiles = function () {
                IndexController.Filer.preloadFiles([
                    // views
                    "home.html",
                    "movies.html",
                    "movie-details.html",
                    // viewsend
                    // templaets
                    "templates/movie-details--list-quotes.html",
                    "templates/movies--browse.html",
                    "templates/movies--list.html",
                    "templates/home--popular-movies.html",
                    "templates/index--quote-of-the-day.html",
                    // templatesend
                    "json/movies.json",
                    "json/popular-content.json"
                ]);
            };
            this.registerRoutes = function () {
                IndexController.Router.defaultConvention(function (route) {
                    return route.trim("/") + ".html";
                });
                IndexController.Router.registerNotFound("errors/404.html");
                IndexController.Router.register("/", "home.html", Controllers.HomeController);
                IndexController.Router.register("/movie-details/{id}", "movie-details.html", Controllers.MovieDetailsController);
                IndexController.Router.register("/movies", "movies.html", Controllers.MoviesController);
                IndexController.Router.register("/movies/{start}", "movies.html", Controllers.MoviesController);
            };
            this.setQuoteOfTheDayTempalteData = function () {
                var quoteOfTheDay = new DB.QuotesDB().getQuoteOfTheDay();
                var movie = new DB.MoviesDB().getMovieOfTheDay();
                IndexController.Templater.template("index--quote-of-the-day", {
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
                IndexController.Router.onLoading(function (route) {
                    $("nav a").removeClass("active");
                    if (route.length < 2) {
                        $("nav a[href*='home']").addClass("active");
                    }
                    else {
                        $("nav a[href*='" + route.split("/")[0] + "']").addClass("active");
                    }
                });
            };
        }
        IndexController.Templater = new Library.Templater();
        IndexController.Router = new Library.Router();
        IndexController.Filer = Library.Filer.Current();
        return IndexController;
    }());
    Controllers.IndexController = IndexController;
})(Controllers || (Controllers = {}));
