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
                var ctrlInstance = new controller();
                _this.routeMap[route] = { view: view, controller: ctrlInstance, route: route };
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
                    var wildcardsMatch = key.match(new RegExp("{((?!}).)*.}", "g"));
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
                    if (!self.templates[name_2]) {
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
                    }
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
                    self.injectTemplate(name_3);
                }
            };
            this.injectTemplate = function (name, force) {
                if (force === void 0) { force = false; }
                var self = _this;
                var elBlock = self.blocks[name];
                var elTemplate = self.templates[name];
                var templateData = self.templatesData[name];
                if (force == true) {
                    elBlock.innerHTML = "";
                }
                if (elBlock && elTemplate && (elBlock.innerHTML.length <= 0 || force == true)) {
                    var html = self.interpolate(elTemplate.innerHTML, templateData);
                    self.replaceHtml(elBlock, html);
                }
            };
            this.reloadTemplate = function (name) {
                _this.injectTemplate(name, true);
            };
            this.interpolate = function (html, data) {
                for (var j in _this.interpolationRules) {
                    html = _this.interpolationRules[j](html, data);
                }
                return html;
            };
            this.replaceHtml = function (elBlock, html) {
                var elTemplateSubstituteNode = document.createElement("div");
                elTemplateSubstituteNode.innerHTML = html;
                var nodes = elTemplateSubstituteNode.childNodes;
                for (var i = 0; i < nodes.length; i++) {
                    var node = nodes[i];
                    if (node.nodeName == "SCRIPT") {
                        var scriptTag = document.createElement("script");
                        scriptTag.innerHTML = node.innerHTML;
                        elBlock.appendChild(scriptTag, elBlock);
                    }
                    else if (nodes[i].nodeName == "#text") {
                        var textNode = document.createTextNode(node.textContent);
                        elBlock.appendChild(textNode, elBlock);
                    }
                    else {
                        elBlock.appendChild(node, elBlock);
                    }
                }
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
            templater.addInterpolationRule(DefaultInterpolationRules.foreachRule);
            templater.addInterpolationRule(DefaultInterpolationRules.ifElseRule);
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
            this.isDownloading = {};
            this.bundles = {};
            this.filesInBundle = {};
            this.registerBundle = function (bundleName, fileNames) {
                _this.bundles[bundleName] = fileNames;
                for (var i in fileNames) {
                    _this.filesInBundle[fileNames[i]] = bundleName;
                }
            };
            this.preloadFiles = function (files) {
                var self = _this;
                for (var i in files) {
                    _this.downloadFile(files[i], true);
                }
            };
            this.getFile = function (fileName) {
                _this.downloadFile(fileName, false);
                return _this.cache[fileName];
            };
        }
        Filer.prototype.getFileContentLocation = function (fileName) {
            return this.filesInBundle[fileName] ? this.filesInBundle[fileName] : fileName;
        };
        Filer.prototype.cacheFile = function (fileName, data) {
            if (data === void 0) { data = undefined; }
            this.cache[fileName] = data ? data : this.cache[fileName];
            return this.cache[fileName];
        };
        Filer.prototype.downloadFile = function (fileName, async) {
            if (async === void 0) { async = true; }
            var or_bundleFile = this.getFileContentLocation(fileName);
            var isBundle = or_bundleFile != fileName;
            if (!this.cacheFile(fileName) && (!async || !this.isDownloading[or_bundleFile])) {
                this.isDownloading[or_bundleFile] = true;
                var self_1 = this;
                return $.ajax({
                    method: "GET",
                    url: or_bundleFile,
                    async: async
                }).done(function (data) {
                    if (!isBundle) {
                        self_1.cacheFile(fileName, data);
                    }
                    else {
                        self_1.processBundleToCache(data);
                    }
                });
            }
        };
        Filer.prototype.processBundleToCache = function (data) {
            for (var file in data) {
                this.cacheFile(file, data[file]);
            }
        };
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
                .replace(/ +/g, '-')
                .replace(new RegExp("^-"), "")
                .replace(new RegExp("-$"), "")
                .replace(new RegExp("--"), "-");
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
            this.beforeLoad = function (route, args) {
                $("title").text("Movie Quotes - Popular movies");
                var movies = new DB.MoviesDB().getPopularMovies().ToArray();
                var quotes = new DB.QuotesDB().getPopularMovieQuotes().ToArray();
                for (var i in movies) {
                    for (var j in quotes) {
                        if (movies[i].slug == quotes[j].movieSlug) {
                            movies[i]["quote"] = quotes[j];
                        }
                    }
                }
                Controllers.IndexController.Templater.template("home--popular-movies", { movies: movies });
            };
        }
        return HomeController;
    }());
    Controllers.HomeController = HomeController;
})(Controllers || (Controllers = {}));
/// <reference path="../_references.ts" />
var Controllers;
(function (Controllers) {
    var MoviesAndSeriesController = (function () {
        function MoviesAndSeriesController() {
            var _this = this;
            this.filterCondition = undefined;
            this.pageSize = 100;
            this.page = 0;
            this.beforeLoad = function (route, args) {
                var self = _this;
                self.db = new DB.MoviesDB();
                $("#search").val('');
                self.filterCondition = args.filter || "";
                self.page = args.page ? parseInt(args.page) - 1 : 0;
                self.page = Math.max(self.page, 0);
                self.filter();
                self.navigate();
                $("title").text("Movie Quotes - Browse movies");
            };
            this.afterLoad = function (route, args) {
                var self = _this;
                var timeoutId = undefined;
                $("#search").on("keyup", function () {
                    clearTimeout(timeoutId);
                    timeoutId = setTimeout(function () {
                        self.filterCondition = $("#search").val();
                        self.filter();
                        self.navigate();
                        Controllers.IndexController.Templater.reloadTemplate("movies--list");
                        Controllers.IndexController.Templater.reloadTemplate("movies--browse");
                    }, 300);
                });
            };
            this.filter = function () {
                var self = _this;
                Controllers.IndexController.Templater.template("movies--list", {
                    "movies": self.db.getByStart(self.filterCondition).OrderBy(function (x) { return x.title; }).Skip(self.page * self.pageSize).Take(self.pageSize).ToArray()
                });
            };
            this.navigate = function () {
                var self = _this;
                var page = self.page;
                var realPage = page + 1;
                var pageCount = Math.ceil(self.db.getByStart(self.filterCondition).Count() / self.pageSize);
                var pages = [];
                var padding = 3;
                for (var i = Math.max(1, realPage - padding); i <= Math.min(realPage + padding, pageCount); i++) {
                    pages.push(i);
                }
                Controllers.IndexController.Templater.template("movies--browse", {
                    "letters": Library.Utils
                        .initArrayOrdered(26, 'A'.charCodeAt(0))
                        .concat(Library.Utils.initArrayOrdered(10, '0'.charCodeAt(0))),
                    "pages": pages,
                    "pageNum": page,
                    "pageCount": pageCount,
                    "isPrevPadded": pages[0] != 1,
                    "isNextPadded": pages[pages.length - 1] < pageCount,
                    "filter": self.filterCondition
                });
            };
        }
        return MoviesAndSeriesController;
    }());
    Controllers.MoviesAndSeriesController = MoviesAndSeriesController;
})(Controllers || (Controllers = {}));
/// <reference path="../_references.ts" />
var Controllers;
(function (Controllers) {
    var MovieDetailsController = (function () {
        function MovieDetailsController() {
            this.beforeLoad = function (route, args) {
                var movie = new DB.MoviesDB().get(args.id);
                var quotes = new DB.QuotesDB().getByMovie(args.id);
                $("title").text("Movie Quotes - " + movie.title);
                Controllers.IndexController.Templater.template("movie-details--list-quotes", {
                    "movie": movie,
                    "quotes": quotes.ToArray()
                });
            };
        }
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
            if (str && str.length > 0) {
                str = str.toLowerCase();
                return this.all().Where(function (x) { return x.title.toLowerCase().indexOf(str) == 0; });
            }
            else {
                return this.all();
            }
        };
        MoviesDB.prototype.getByContains = function (str) {
            if (str && str.length > 0) {
                str = str.toLowerCase();
                return this.all().Where(function (x) { return x.title.toLowerCase().indexOf(str) >= 0; });
            }
            else {
                return this.all();
            }
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
    var SerieModel = (function (_super) {
        __extends(SerieModel, _super);
        function SerieModel(id, title, year, img) {
            _super.call(this, id);
            this.title = title;
            this.year = year;
            this.coverPhoto = this.resizeImage(img, 182, 268);
            this.smallCoverPhoto = this.resizeImage(img, 120, 175);
            this.verySmallCoverPhoto = this.resizeImage(img, 90, 130);
            this.slug = Library.Utils.slugify(title + " " + year);
        }
        SerieModel.prototype.resizeImage = function (img, w, h) {
            if (img && img != null) {
                return img.replace("UX182", "UX" + w).replace(",182", "," + w).replace(",268", "," + h);
            }
            else {
                return "http://placehold.it/" + w + "x" + h;
            }
        };
        return SerieModel;
    }(DB.BaseModel));
    var SeriesDB = (function (_super) {
        __extends(SeriesDB, _super);
        function SeriesDB() {
            _super.call(this, "json/series.json");
        }
        SeriesDB.prototype.all = function () {
            var all = _super.prototype.all.call(this).Select(function (x) { return new SerieModel(x.id, x.title, x.year, x.img); });
            return all;
        };
        SeriesDB.prototype.getByStart = function (str) {
            if (str && str.length > 0) {
                str = str.toLowerCase();
                return this.all().Where(function (x) { return x.title.toLowerCase().indexOf(str) == 0; });
            }
            else {
                return this.all();
            }
        };
        SeriesDB.prototype.getByContains = function (str) {
            if (str && str.length > 0) {
                str = str.toLowerCase();
                return this.all().Where(function (x) { return x.title.toLowerCase().indexOf(str) >= 0; });
            }
            else {
                return this.all();
            }
        };
        SeriesDB.prototype.take = function (offset, take) {
            return this.all().Skip(offset).Take(take);
        };
        SeriesDB.prototype.get = function (slug) {
            return this.all().Single(function (x) { return x.slug == slug; });
        };
        SeriesDB.prototype.getMovieOfTheDay = function () {
            var content = this.getPopularContent();
            var movie = content['serie-of-the-day'];
            return new SerieModel(movie.id, movie.title, movie.year, movie.img);
        };
        SeriesDB.prototype.getPopularMovies = function () {
            var content = this.getPopularContent();
            var movies = content['popular-series'];
            return Enumerable.From(movies).Select(function (x) { return new SerieModel(x.id, x.title, x.year, x.img); });
        };
        SeriesDB.prototype.getRandomMovie = function (notIn) {
            if (notIn === void 0) { notIn = []; }
            var notInEnum = Enumerable.From(notIn);
            var notSeenMovies = this.all().Where(function (x) { return notInEnum.Any(function (y) { return y == x.slug; }); }).ToArray();
            if (notSeenMovies.length == 0)
                return undefined;
            var hash = Library.Utils.hashCode(Library.Utils.now()) % notSeenMovies.length;
            return this.get(notSeenMovies[hash].slug);
        };
        return SeriesDB;
    }(DB.BaseDB));
    DB.SeriesDB = SeriesDB;
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
        QuotesDB.prototype.getByMovies = function (movieSlugs) {
            var files = Enumerable.From(movieSlugs).Select(function (x) { return "json/movie-quotes/" + x + ".json"; }).ToArray();
            var quotes = [];
            for (var i in movieSlugs) {
                var byMovie = this.getByMovie(movieSlugs[i]);
                quotes.push(byMovie.First());
            }
            return Enumerable.From(quotes);
        };
        QuotesDB.prototype.getPopularMovieQuotes = function () {
            var content = this.getPopularContent();
            var quotes = content['popular-movie-quotes'];
            var id = 0;
            return Enumerable.From(quotes).Select(function (x) { return new QuoteModel(id, x.lines, x.movieSlug); });
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
/// <reference path="controllers/MoviesAndSeriesController.ts" />
/// <reference path="controllers/MovieDetailsController.ts" />
/// <reference path="db/BaseDB.ts" />
/// <reference path="db/MoviesDB.ts" />
/// <reference path="db/SeriesDB.ts" />
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
                _this.bootstrapSemanticComponents();
                IndexController.Router.onLoaded(IndexController.Templater.work);
            };
            this.preloadFiles = function () {
                IndexController.Filer.registerBundle("json/bundles/views.json", [
                    "home.html",
"movie-details.html",
"movies.html",
"series.html",

                ]);
                IndexController.Filer.registerBundle("json/bundles/templates.json", [
                    "home--popular-movies.html",
"index--quote-of-the-day.html",
"movie-details--list-quotes.html",
"movies--browse.html",
"movies--list.html",

                ]);
                IndexController.Filer.preloadFiles([
                    "home.html",
"movie-details.html",
"movies.html",
"series.html",

                    "home--popular-movies.html",
"index--quote-of-the-day.html",
"movie-details--list-quotes.html",
"movies--browse.html",
"movies--list.html",

                    "json/movies.json",
                    "json/series.json",
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
                IndexController.Router.register("/movies", "movies.html", Controllers.MoviesAndSeriesController);
                IndexController.Router.register("/movies/{filter}", "movies.html", Controllers.MoviesAndSeriesController);
                IndexController.Router.register("/movies/{filter}/{page}", "movies.html", Controllers.MoviesAndSeriesController);
                IndexController.Router.register("/series", "series.html", Controllers.MoviesAndSeriesController);
                IndexController.Router.register("/series/{filter}", "series.html", Controllers.MoviesAndSeriesController);
                IndexController.Router.register("/series/{filter}/{page}", "series.html", Controllers.MoviesAndSeriesController);
            };
            this.setQuoteOfTheDayTempalteData = function () {
                var quoteOfTheDay = new DB.QuotesDB().getQuoteOfTheDay();
                var movie = new DB.MoviesDB().getMovieOfTheDay();
                movie.slug = quoteOfTheDay.movieSlug;
                IndexController.Templater.template("index--quote-of-the-day", {
                    "movie": movie,
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
                        $("nav a[href='home']").addClass("active");
                    }
                    else {
                        $("nav a[href*='" + route.split("/")[0] + "']").addClass("active");
                    }
                });
            };
            this.bootstrapSemanticComponents = function () {
                var $$ = $;
                $("#search").on("click", function () {
                    IndexController.Router.go("/movies/");
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
/*--------------------------------------------------------------------------
* linq.js - LINQ for JavaScript
* ver 2.2.0.2 (Jan. 21th, 2011)
*
* created and maintained by neuecc <ils@neue.cc>
* licensed under Microsoft Public License(Ms-PL)
* http://neue.cc/
* http://linqjs.codeplex.com/
*--------------------------------------------------------------------------*/
Enumerable = (function () {
    var Enumerable = function (getEnumerator) {
        this.GetEnumerator = getEnumerator;
    };
    // Generator
    Enumerable.Choice = function () {
        var args = (arguments[0] instanceof Array) ? arguments[0] : arguments;
        return new Enumerable(function () {
            return new IEnumerator(Functions.Blank, function () {
                return this.Yield(args[Math.floor(Math.random() * args.length)]);
            }, Functions.Blank);
        });
    };
    Enumerable.Cycle = function () {
        var args = (arguments[0] instanceof Array) ? arguments[0] : arguments;
        return new Enumerable(function () {
            var index = 0;
            return new IEnumerator(Functions.Blank, function () {
                if (index >= args.length)
                    index = 0;
                return this.Yield(args[index++]);
            }, Functions.Blank);
        });
    };
    Enumerable.Empty = function () {
        return new Enumerable(function () {
            return new IEnumerator(Functions.Blank, function () { return false; }, Functions.Blank);
        });
    };
    Enumerable.From = function (obj) {
        if (obj == null) {
            return Enumerable.Empty();
        }
        if (obj instanceof Enumerable) {
            return obj;
        }
        if (typeof obj == Types.Number || typeof obj == Types.Boolean) {
            return Enumerable.Repeat(obj, 1);
        }
        if (typeof obj == Types.String) {
            return new Enumerable(function () {
                var index = 0;
                return new IEnumerator(Functions.Blank, function () {
                    return (index < obj.length) ? this.Yield(obj.charAt(index++)) : false;
                }, Functions.Blank);
            });
        }
        if (typeof obj != Types.Function) {
            // array or array like object
            if (typeof obj.length == Types.Number) {
                return new ArrayEnumerable(obj);
            }
            // JScript's IEnumerable
            if (!(obj instanceof Object) && Utils.IsIEnumerable(obj)) {
                return new Enumerable(function () {
                    var isFirst = true;
                    var enumerator;
                    return new IEnumerator(function () { enumerator = new Enumerator(obj); }, function () {
                        if (isFirst)
                            isFirst = false;
                        else
                            enumerator.moveNext();
                        return (enumerator.atEnd()) ? false : this.Yield(enumerator.item());
                    }, Functions.Blank);
                });
            }
        }
        // case function/object : Create KeyValuePair[]
        return new Enumerable(function () {
            var array = [];
            var index = 0;
            return new IEnumerator(function () {
                for (var key in obj) {
                    if (!(obj[key] instanceof Function)) {
                        array.push({ Key: key, Value: obj[key] });
                    }
                }
            }, function () {
                return (index < array.length)
                    ? this.Yield(array[index++])
                    : false;
            }, Functions.Blank);
        });
    },
        Enumerable.Return = function (element) {
            return Enumerable.Repeat(element, 1);
        };
    // Overload:function(input, pattern)
    // Overload:function(input, pattern, flags)
    Enumerable.Matches = function (input, pattern, flags) {
        if (flags == null)
            flags = "";
        if (pattern instanceof RegExp) {
            flags += (pattern.ignoreCase) ? "i" : "";
            flags += (pattern.multiline) ? "m" : "";
            pattern = pattern.source;
        }
        if (flags.indexOf("g") === -1)
            flags += "g";
        return new Enumerable(function () {
            var regex;
            return new IEnumerator(function () { regex = new RegExp(pattern, flags); }, function () {
                var match = regex.exec(input);
                return (match) ? this.Yield(match) : false;
            }, Functions.Blank);
        });
    };
    // Overload:function(start, count)
    // Overload:function(start, count, step)
    Enumerable.Range = function (start, count, step) {
        if (step == null)
            step = 1;
        return Enumerable.ToInfinity(start, step).Take(count);
    };
    // Overload:function(start, count)
    // Overload:function(start, count, step)
    Enumerable.RangeDown = function (start, count, step) {
        if (step == null)
            step = 1;
        return Enumerable.ToNegativeInfinity(start, step).Take(count);
    };
    // Overload:function(start, to)
    // Overload:function(start, to, step)
    Enumerable.RangeTo = function (start, to, step) {
        if (step == null)
            step = 1;
        return (start < to)
            ? Enumerable.ToInfinity(start, step).TakeWhile(function (i) { return i <= to; })
            : Enumerable.ToNegativeInfinity(start, step).TakeWhile(function (i) { return i >= to; });
    };
    // Overload:function(obj)
    // Overload:function(obj, num)
    Enumerable.Repeat = function (obj, num) {
        if (num != null)
            return Enumerable.Repeat(obj).Take(num);
        return new Enumerable(function () {
            return new IEnumerator(Functions.Blank, function () { return this.Yield(obj); }, Functions.Blank);
        });
    };
    Enumerable.RepeatWithFinalize = function (initializer, finalizer) {
        initializer = Utils.CreateLambda(initializer);
        finalizer = Utils.CreateLambda(finalizer);
        return new Enumerable(function () {
            var element;
            return new IEnumerator(function () { element = initializer(); }, function () { return this.Yield(element); }, function () {
                if (element != null) {
                    finalizer(element);
                    element = null;
                }
            });
        });
    };
    // Overload:function(func)
    // Overload:function(func, count)
    Enumerable.Generate = function (func, count) {
        if (count != null)
            return Enumerable.Generate(func).Take(count);
        func = Utils.CreateLambda(func);
        return new Enumerable(function () {
            return new IEnumerator(Functions.Blank, function () { return this.Yield(func()); }, Functions.Blank);
        });
    };
    // Overload:function()
    // Overload:function(start)
    // Overload:function(start, step)
    Enumerable.ToInfinity = function (start, step) {
        if (start == null)
            start = 0;
        if (step == null)
            step = 1;
        return new Enumerable(function () {
            var value;
            return new IEnumerator(function () { value = start - step; }, function () { return this.Yield(value += step); }, Functions.Blank);
        });
    };
    // Overload:function()
    // Overload:function(start)
    // Overload:function(start, step)
    Enumerable.ToNegativeInfinity = function (start, step) {
        if (start == null)
            start = 0;
        if (step == null)
            step = 1;
        return new Enumerable(function () {
            var value;
            return new IEnumerator(function () { value = start + step; }, function () { return this.Yield(value -= step); }, Functions.Blank);
        });
    };
    Enumerable.Unfold = function (seed, func) {
        func = Utils.CreateLambda(func);
        return new Enumerable(function () {
            var isFirst = true;
            var value;
            return new IEnumerator(Functions.Blank, function () {
                if (isFirst) {
                    isFirst = false;
                    value = seed;
                    return this.Yield(value);
                }
                value = func(value);
                return this.Yield(value);
            }, Functions.Blank);
        });
    };
    // Extension Methods
    Enumerable.prototype =
        {
            /* Projection and Filtering Methods */
            // Overload:function(func)
            // Overload:function(func, resultSelector<element>)
            // Overload:function(func, resultSelector<element, nestLevel>)
            CascadeBreadthFirst: function (func, resultSelector) {
                var source = this;
                func = Utils.CreateLambda(func);
                resultSelector = Utils.CreateLambda(resultSelector);
                return new Enumerable(function () {
                    var enumerator;
                    var nestLevel = 0;
                    var buffer = [];
                    return new IEnumerator(function () { enumerator = source.GetEnumerator(); }, function () {
                        while (true) {
                            if (enumerator.MoveNext()) {
                                buffer.push(enumerator.Current());
                                return this.Yield(resultSelector(enumerator.Current(), nestLevel));
                            }
                            var next = Enumerable.From(buffer).SelectMany(function (x) { return func(x); });
                            if (!next.Any()) {
                                return false;
                            }
                            else {
                                nestLevel++;
                                buffer = [];
                                Utils.Dispose(enumerator);
                                enumerator = next.GetEnumerator();
                            }
                        }
                    }, function () { Utils.Dispose(enumerator); });
                });
            },
            // Overload:function(func)
            // Overload:function(func, resultSelector<element>)
            // Overload:function(func, resultSelector<element, nestLevel>)
            CascadeDepthFirst: function (func, resultSelector) {
                var source = this;
                func = Utils.CreateLambda(func);
                resultSelector = Utils.CreateLambda(resultSelector);
                return new Enumerable(function () {
                    var enumeratorStack = [];
                    var enumerator;
                    return new IEnumerator(function () { enumerator = source.GetEnumerator(); }, function () {
                        while (true) {
                            if (enumerator.MoveNext()) {
                                var value = resultSelector(enumerator.Current(), enumeratorStack.length);
                                enumeratorStack.push(enumerator);
                                enumerator = Enumerable.From(func(enumerator.Current())).GetEnumerator();
                                return this.Yield(value);
                            }
                            if (enumeratorStack.length <= 0)
                                return false;
                            Utils.Dispose(enumerator);
                            enumerator = enumeratorStack.pop();
                        }
                    }, function () {
                        try {
                            Utils.Dispose(enumerator);
                        }
                        finally {
                            Enumerable.From(enumeratorStack).ForEach(function (s) { s.Dispose(); });
                        }
                    });
                });
            },
            Flatten: function () {
                var source = this;
                return new Enumerable(function () {
                    var enumerator;
                    var middleEnumerator = null;
                    return new IEnumerator(function () { enumerator = source.GetEnumerator(); }, function () {
                        while (true) {
                            if (middleEnumerator != null) {
                                if (middleEnumerator.MoveNext()) {
                                    return this.Yield(middleEnumerator.Current());
                                }
                                else {
                                    middleEnumerator = null;
                                }
                            }
                            if (enumerator.MoveNext()) {
                                if (enumerator.Current() instanceof Array) {
                                    Utils.Dispose(middleEnumerator);
                                    middleEnumerator = Enumerable.From(enumerator.Current())
                                        .SelectMany(Functions.Identity)
                                        .Flatten()
                                        .GetEnumerator();
                                    continue;
                                }
                                else {
                                    return this.Yield(enumerator.Current());
                                }
                            }
                            return false;
                        }
                    }, function () {
                        try {
                            Utils.Dispose(enumerator);
                        }
                        finally {
                            Utils.Dispose(middleEnumerator);
                        }
                    });
                });
            },
            Pairwise: function (selector) {
                var source = this;
                selector = Utils.CreateLambda(selector);
                return new Enumerable(function () {
                    var enumerator;
                    return new IEnumerator(function () {
                        enumerator = source.GetEnumerator();
                        enumerator.MoveNext();
                    }, function () {
                        var prev = enumerator.Current();
                        return (enumerator.MoveNext())
                            ? this.Yield(selector(prev, enumerator.Current()))
                            : false;
                    }, function () { Utils.Dispose(enumerator); });
                });
            },
            // Overload:function(func)
            // Overload:function(seed,func<value,element>)
            // Overload:function(seed,func<value,element>,resultSelector)
            Scan: function (seed, func, resultSelector) {
                if (resultSelector != null)
                    return this.Scan(seed, func).Select(resultSelector);
                var isUseSeed;
                if (func == null) {
                    func = Utils.CreateLambda(seed); // arguments[0]
                    isUseSeed = false;
                }
                else {
                    func = Utils.CreateLambda(func);
                    isUseSeed = true;
                }
                var source = this;
                return new Enumerable(function () {
                    var enumerator;
                    var value;
                    var isFirst = true;
                    return new IEnumerator(function () { enumerator = source.GetEnumerator(); }, function () {
                        if (isFirst) {
                            isFirst = false;
                            if (!isUseSeed) {
                                if (enumerator.MoveNext()) {
                                    return this.Yield(value = enumerator.Current());
                                }
                            }
                            else {
                                return this.Yield(value = seed);
                            }
                        }
                        return (enumerator.MoveNext())
                            ? this.Yield(value = func(value, enumerator.Current()))
                            : false;
                    }, function () { Utils.Dispose(enumerator); });
                });
            },
            // Overload:function(selector<element>)
            // Overload:function(selector<element,index>)
            Select: function (selector) {
                var source = this;
                selector = Utils.CreateLambda(selector);
                return new Enumerable(function () {
                    var enumerator;
                    var index = 0;
                    return new IEnumerator(function () { enumerator = source.GetEnumerator(); }, function () {
                        return (enumerator.MoveNext())
                            ? this.Yield(selector(enumerator.Current(), index++))
                            : false;
                    }, function () { Utils.Dispose(enumerator); });
                });
            },
            // Overload:function(collectionSelector<element>)
            // Overload:function(collectionSelector<element,index>)
            // Overload:function(collectionSelector<element>,resultSelector)
            // Overload:function(collectionSelector<element,index>,resultSelector)
            SelectMany: function (collectionSelector, resultSelector) {
                var source = this;
                collectionSelector = Utils.CreateLambda(collectionSelector);
                if (resultSelector == null)
                    resultSelector = function (a, b) { return b; };
                resultSelector = Utils.CreateLambda(resultSelector);
                return new Enumerable(function () {
                    var enumerator;
                    var middleEnumerator = undefined;
                    var index = 0;
                    return new IEnumerator(function () { enumerator = source.GetEnumerator(); }, function () {
                        if (middleEnumerator === undefined) {
                            if (!enumerator.MoveNext())
                                return false;
                        }
                        do {
                            if (middleEnumerator == null) {
                                var middleSeq = collectionSelector(enumerator.Current(), index++);
                                middleEnumerator = Enumerable.From(middleSeq).GetEnumerator();
                            }
                            if (middleEnumerator.MoveNext()) {
                                return this.Yield(resultSelector(enumerator.Current(), middleEnumerator.Current()));
                            }
                            Utils.Dispose(middleEnumerator);
                            middleEnumerator = null;
                        } while (enumerator.MoveNext());
                        return false;
                    }, function () {
                        try {
                            Utils.Dispose(enumerator);
                        }
                        finally {
                            Utils.Dispose(middleEnumerator);
                        }
                    });
                });
            },
            // Overload:function(predicate<element>)
            // Overload:function(predicate<element,index>)
            Where: function (predicate) {
                predicate = Utils.CreateLambda(predicate);
                var source = this;
                return new Enumerable(function () {
                    var enumerator;
                    var index = 0;
                    return new IEnumerator(function () { enumerator = source.GetEnumerator(); }, function () {
                        while (enumerator.MoveNext()) {
                            if (predicate(enumerator.Current(), index++)) {
                                return this.Yield(enumerator.Current());
                            }
                        }
                        return false;
                    }, function () { Utils.Dispose(enumerator); });
                });
            },
            OfType: function (type) {
                var typeName;
                switch (type) {
                    case Number:
                        typeName = Types.Number;
                        break;
                    case String:
                        typeName = Types.String;
                        break;
                    case Boolean:
                        typeName = Types.Boolean;
                        break;
                    case Function:
                        typeName = Types.Function;
                        break;
                    default:
                        typeName = null;
                        break;
                }
                return (typeName === null)
                    ? this.Where(function (x) { return x instanceof type; })
                    : this.Where(function (x) { return typeof x === typeName; });
            },
            // Overload:function(second,selector<outer,inner>)
            // Overload:function(second,selector<outer,inner,index>)
            Zip: function (second, selector) {
                selector = Utils.CreateLambda(selector);
                var source = this;
                return new Enumerable(function () {
                    var firstEnumerator;
                    var secondEnumerator;
                    var index = 0;
                    return new IEnumerator(function () {
                        firstEnumerator = source.GetEnumerator();
                        secondEnumerator = Enumerable.From(second).GetEnumerator();
                    }, function () {
                        if (firstEnumerator.MoveNext() && secondEnumerator.MoveNext()) {
                            return this.Yield(selector(firstEnumerator.Current(), secondEnumerator.Current(), index++));
                        }
                        return false;
                    }, function () {
                        try {
                            Utils.Dispose(firstEnumerator);
                        }
                        finally {
                            Utils.Dispose(secondEnumerator);
                        }
                    });
                });
            },
            /* Join Methods */
            // Overload:function (inner, outerKeySelector, innerKeySelector, resultSelector)
            // Overload:function (inner, outerKeySelector, innerKeySelector, resultSelector, compareSelector)
            Join: function (inner, outerKeySelector, innerKeySelector, resultSelector, compareSelector) {
                outerKeySelector = Utils.CreateLambda(outerKeySelector);
                innerKeySelector = Utils.CreateLambda(innerKeySelector);
                resultSelector = Utils.CreateLambda(resultSelector);
                compareSelector = Utils.CreateLambda(compareSelector);
                var source = this;
                return new Enumerable(function () {
                    var outerEnumerator;
                    var lookup;
                    var innerElements = null;
                    var innerCount = 0;
                    return new IEnumerator(function () {
                        outerEnumerator = source.GetEnumerator();
                        lookup = Enumerable.From(inner).ToLookup(innerKeySelector, Functions.Identity, compareSelector);
                    }, function () {
                        while (true) {
                            if (innerElements != null) {
                                var innerElement = innerElements[innerCount++];
                                if (innerElement !== undefined) {
                                    return this.Yield(resultSelector(outerEnumerator.Current(), innerElement));
                                }
                                innerElement = null;
                                innerCount = 0;
                            }
                            if (outerEnumerator.MoveNext()) {
                                var key = outerKeySelector(outerEnumerator.Current());
                                innerElements = lookup.Get(key).ToArray();
                            }
                            else {
                                return false;
                            }
                        }
                    }, function () { Utils.Dispose(outerEnumerator); });
                });
            },
            // Overload:function (inner, outerKeySelector, innerKeySelector, resultSelector)
            // Overload:function (inner, outerKeySelector, innerKeySelector, resultSelector, compareSelector)
            GroupJoin: function (inner, outerKeySelector, innerKeySelector, resultSelector, compareSelector) {
                outerKeySelector = Utils.CreateLambda(outerKeySelector);
                innerKeySelector = Utils.CreateLambda(innerKeySelector);
                resultSelector = Utils.CreateLambda(resultSelector);
                compareSelector = Utils.CreateLambda(compareSelector);
                var source = this;
                return new Enumerable(function () {
                    var enumerator = source.GetEnumerator();
                    var lookup = null;
                    return new IEnumerator(function () {
                        enumerator = source.GetEnumerator();
                        lookup = Enumerable.From(inner).ToLookup(innerKeySelector, Functions.Identity, compareSelector);
                    }, function () {
                        if (enumerator.MoveNext()) {
                            var innerElement = lookup.Get(outerKeySelector(enumerator.Current()));
                            return this.Yield(resultSelector(enumerator.Current(), innerElement));
                        }
                        return false;
                    }, function () { Utils.Dispose(enumerator); });
                });
            },
            /* Set Methods */
            All: function (predicate) {
                predicate = Utils.CreateLambda(predicate);
                var result = true;
                this.ForEach(function (x) {
                    if (!predicate(x)) {
                        result = false;
                        return false; // break
                    }
                });
                return result;
            },
            // Overload:function()
            // Overload:function(predicate)
            Any: function (predicate) {
                predicate = Utils.CreateLambda(predicate);
                var enumerator = this.GetEnumerator();
                try {
                    if (arguments.length == 0)
                        return enumerator.MoveNext(); // case:function()
                    while (enumerator.MoveNext()) {
                        if (predicate(enumerator.Current()))
                            return true;
                    }
                    return false;
                }
                finally {
                    Utils.Dispose(enumerator);
                }
            },
            Concat: function (second) {
                var source = this;
                return new Enumerable(function () {
                    var firstEnumerator;
                    var secondEnumerator;
                    return new IEnumerator(function () { firstEnumerator = source.GetEnumerator(); }, function () {
                        if (secondEnumerator == null) {
                            if (firstEnumerator.MoveNext())
                                return this.Yield(firstEnumerator.Current());
                            secondEnumerator = Enumerable.From(second).GetEnumerator();
                        }
                        if (secondEnumerator.MoveNext())
                            return this.Yield(secondEnumerator.Current());
                        return false;
                    }, function () {
                        try {
                            Utils.Dispose(firstEnumerator);
                        }
                        finally {
                            Utils.Dispose(secondEnumerator);
                        }
                    });
                });
            },
            Insert: function (index, second) {
                var source = this;
                return new Enumerable(function () {
                    var firstEnumerator;
                    var secondEnumerator;
                    var count = 0;
                    var isEnumerated = false;
                    return new IEnumerator(function () {
                        firstEnumerator = source.GetEnumerator();
                        secondEnumerator = Enumerable.From(second).GetEnumerator();
                    }, function () {
                        if (count == index && secondEnumerator.MoveNext()) {
                            isEnumerated = true;
                            return this.Yield(secondEnumerator.Current());
                        }
                        if (firstEnumerator.MoveNext()) {
                            count++;
                            return this.Yield(firstEnumerator.Current());
                        }
                        if (!isEnumerated && secondEnumerator.MoveNext()) {
                            return this.Yield(secondEnumerator.Current());
                        }
                        return false;
                    }, function () {
                        try {
                            Utils.Dispose(firstEnumerator);
                        }
                        finally {
                            Utils.Dispose(secondEnumerator);
                        }
                    });
                });
            },
            Alternate: function (value) {
                value = Enumerable.Return(value);
                return this.SelectMany(function (elem) {
                    return Enumerable.Return(elem).Concat(value);
                }).TakeExceptLast();
            },
            // Overload:function(value)
            // Overload:function(value, compareSelector)
            Contains: function (value, compareSelector) {
                compareSelector = Utils.CreateLambda(compareSelector);
                var enumerator = this.GetEnumerator();
                try {
                    while (enumerator.MoveNext()) {
                        if (compareSelector(enumerator.Current()) === value)
                            return true;
                    }
                    return false;
                }
                finally {
                    Utils.Dispose(enumerator);
                }
            },
            DefaultIfEmpty: function (defaultValue) {
                var source = this;
                return new Enumerable(function () {
                    var enumerator;
                    var isFirst = true;
                    return new IEnumerator(function () { enumerator = source.GetEnumerator(); }, function () {
                        if (enumerator.MoveNext()) {
                            isFirst = false;
                            return this.Yield(enumerator.Current());
                        }
                        else if (isFirst) {
                            isFirst = false;
                            return this.Yield(defaultValue);
                        }
                        return false;
                    }, function () { Utils.Dispose(enumerator); });
                });
            },
            // Overload:function()
            // Overload:function(compareSelector)
            Distinct: function (compareSelector) {
                return this.Except(Enumerable.Empty(), compareSelector);
            },
            // Overload:function(second)
            // Overload:function(second, compareSelector)
            Except: function (second, compareSelector) {
                compareSelector = Utils.CreateLambda(compareSelector);
                var source = this;
                return new Enumerable(function () {
                    var enumerator;
                    var keys;
                    return new IEnumerator(function () {
                        enumerator = source.GetEnumerator();
                        keys = new Dictionary(compareSelector);
                        Enumerable.From(second).ForEach(function (key) { keys.Add(key); });
                    }, function () {
                        while (enumerator.MoveNext()) {
                            var current = enumerator.Current();
                            if (!keys.Contains(current)) {
                                keys.Add(current);
                                return this.Yield(current);
                            }
                        }
                        return false;
                    }, function () { Utils.Dispose(enumerator); });
                });
            },
            // Overload:function(second)
            // Overload:function(second, compareSelector)
            Intersect: function (second, compareSelector) {
                compareSelector = Utils.CreateLambda(compareSelector);
                var source = this;
                return new Enumerable(function () {
                    var enumerator;
                    var keys;
                    var outs;
                    return new IEnumerator(function () {
                        enumerator = source.GetEnumerator();
                        keys = new Dictionary(compareSelector);
                        Enumerable.From(second).ForEach(function (key) { keys.Add(key); });
                        outs = new Dictionary(compareSelector);
                    }, function () {
                        while (enumerator.MoveNext()) {
                            var current = enumerator.Current();
                            if (!outs.Contains(current) && keys.Contains(current)) {
                                outs.Add(current);
                                return this.Yield(current);
                            }
                        }
                        return false;
                    }, function () { Utils.Dispose(enumerator); });
                });
            },
            // Overload:function(second)
            // Overload:function(second, compareSelector)
            SequenceEqual: function (second, compareSelector) {
                compareSelector = Utils.CreateLambda(compareSelector);
                var firstEnumerator = this.GetEnumerator();
                try {
                    var secondEnumerator = Enumerable.From(second).GetEnumerator();
                    try {
                        while (firstEnumerator.MoveNext()) {
                            if (!secondEnumerator.MoveNext()
                                || compareSelector(firstEnumerator.Current()) !== compareSelector(secondEnumerator.Current())) {
                                return false;
                            }
                        }
                        if (secondEnumerator.MoveNext())
                            return false;
                        return true;
                    }
                    finally {
                        Utils.Dispose(secondEnumerator);
                    }
                }
                finally {
                    Utils.Dispose(firstEnumerator);
                }
            },
            Union: function (second, compareSelector) {
                compareSelector = Utils.CreateLambda(compareSelector);
                var source = this;
                return new Enumerable(function () {
                    var firstEnumerator;
                    var secondEnumerator;
                    var keys;
                    return new IEnumerator(function () {
                        firstEnumerator = source.GetEnumerator();
                        keys = new Dictionary(compareSelector);
                    }, function () {
                        var current;
                        if (secondEnumerator === undefined) {
                            while (firstEnumerator.MoveNext()) {
                                current = firstEnumerator.Current();
                                if (!keys.Contains(current)) {
                                    keys.Add(current);
                                    return this.Yield(current);
                                }
                            }
                            secondEnumerator = Enumerable.From(second).GetEnumerator();
                        }
                        while (secondEnumerator.MoveNext()) {
                            current = secondEnumerator.Current();
                            if (!keys.Contains(current)) {
                                keys.Add(current);
                                return this.Yield(current);
                            }
                        }
                        return false;
                    }, function () {
                        try {
                            Utils.Dispose(firstEnumerator);
                        }
                        finally {
                            Utils.Dispose(secondEnumerator);
                        }
                    });
                });
            },
            /* Ordering Methods */
            OrderBy: function (keySelector) {
                return new OrderedEnumerable(this, keySelector, false);
            },
            OrderByDescending: function (keySelector) {
                return new OrderedEnumerable(this, keySelector, true);
            },
            Reverse: function () {
                var source = this;
                return new Enumerable(function () {
                    var buffer;
                    var index;
                    return new IEnumerator(function () {
                        buffer = source.ToArray();
                        index = buffer.length;
                    }, function () {
                        return (index > 0)
                            ? this.Yield(buffer[--index])
                            : false;
                    }, Functions.Blank);
                });
            },
            Shuffle: function () {
                var source = this;
                return new Enumerable(function () {
                    var buffer;
                    return new IEnumerator(function () { buffer = source.ToArray(); }, function () {
                        if (buffer.length > 0) {
                            var i = Math.floor(Math.random() * buffer.length);
                            return this.Yield(buffer.splice(i, 1)[0]);
                        }
                        return false;
                    }, Functions.Blank);
                });
            },
            /* Grouping Methods */
            // Overload:function(keySelector)
            // Overload:function(keySelector,elementSelector)
            // Overload:function(keySelector,elementSelector,resultSelector)
            // Overload:function(keySelector,elementSelector,resultSelector,compareSelector)
            GroupBy: function (keySelector, elementSelector, resultSelector, compareSelector) {
                var source = this;
                keySelector = Utils.CreateLambda(keySelector);
                elementSelector = Utils.CreateLambda(elementSelector);
                if (resultSelector != null)
                    resultSelector = Utils.CreateLambda(resultSelector);
                compareSelector = Utils.CreateLambda(compareSelector);
                return new Enumerable(function () {
                    var enumerator;
                    return new IEnumerator(function () {
                        enumerator = source.ToLookup(keySelector, elementSelector, compareSelector)
                            .ToEnumerable()
                            .GetEnumerator();
                    }, function () {
                        while (enumerator.MoveNext()) {
                            return (resultSelector == null)
                                ? this.Yield(enumerator.Current())
                                : this.Yield(resultSelector(enumerator.Current().Key(), enumerator.Current()));
                        }
                        return false;
                    }, function () { Utils.Dispose(enumerator); });
                });
            },
            // Overload:function(keySelector)
            // Overload:function(keySelector,elementSelector)
            // Overload:function(keySelector,elementSelector,resultSelector)
            // Overload:function(keySelector,elementSelector,resultSelector,compareSelector)
            PartitionBy: function (keySelector, elementSelector, resultSelector, compareSelector) {
                var source = this;
                keySelector = Utils.CreateLambda(keySelector);
                elementSelector = Utils.CreateLambda(elementSelector);
                compareSelector = Utils.CreateLambda(compareSelector);
                var hasResultSelector;
                if (resultSelector == null) {
                    hasResultSelector = false;
                    resultSelector = function (key, group) { return new Grouping(key, group); };
                }
                else {
                    hasResultSelector = true;
                    resultSelector = Utils.CreateLambda(resultSelector);
                }
                return new Enumerable(function () {
                    var enumerator;
                    var key;
                    var compareKey;
                    var group = [];
                    return new IEnumerator(function () {
                        enumerator = source.GetEnumerator();
                        if (enumerator.MoveNext()) {
                            key = keySelector(enumerator.Current());
                            compareKey = compareSelector(key);
                            group.push(elementSelector(enumerator.Current()));
                        }
                    }, function () {
                        var hasNext;
                        while ((hasNext = enumerator.MoveNext()) == true) {
                            if (compareKey === compareSelector(keySelector(enumerator.Current()))) {
                                group.push(elementSelector(enumerator.Current()));
                            }
                            else
                                break;
                        }
                        if (group.length > 0) {
                            var result = (hasResultSelector)
                                ? resultSelector(key, Enumerable.From(group))
                                : resultSelector(key, group);
                            if (hasNext) {
                                key = keySelector(enumerator.Current());
                                compareKey = compareSelector(key);
                                group = [elementSelector(enumerator.Current())];
                            }
                            else
                                group = [];
                            return this.Yield(result);
                        }
                        return false;
                    }, function () { Utils.Dispose(enumerator); });
                });
            },
            BufferWithCount: function (count) {
                var source = this;
                return new Enumerable(function () {
                    var enumerator;
                    return new IEnumerator(function () { enumerator = source.GetEnumerator(); }, function () {
                        var array = [];
                        var index = 0;
                        while (enumerator.MoveNext()) {
                            array.push(enumerator.Current());
                            if (++index >= count)
                                return this.Yield(array);
                        }
                        if (array.length > 0)
                            return this.Yield(array);
                        return false;
                    }, function () { Utils.Dispose(enumerator); });
                });
            },
            /* Aggregate Methods */
            // Overload:function(func)
            // Overload:function(seed,func)
            // Overload:function(seed,func,resultSelector)
            Aggregate: function (seed, func, resultSelector) {
                return this.Scan(seed, func, resultSelector).Last();
            },
            // Overload:function()
            // Overload:function(selector)
            Average: function (selector) {
                selector = Utils.CreateLambda(selector);
                var sum = 0;
                var count = 0;
                this.ForEach(function (x) {
                    sum += selector(x);
                    ++count;
                });
                return sum / count;
            },
            // Overload:function()
            // Overload:function(predicate)
            Count: function (predicate) {
                predicate = (predicate == null) ? Functions.True : Utils.CreateLambda(predicate);
                var count = 0;
                this.ForEach(function (x, i) {
                    if (predicate(x, i))
                        ++count;
                });
                return count;
            },
            // Overload:function()
            // Overload:function(selector)
            Max: function (selector) {
                if (selector == null)
                    selector = Functions.Identity;
                return this.Select(selector).Aggregate(function (a, b) { return (a > b) ? a : b; });
            },
            // Overload:function()
            // Overload:function(selector)
            Min: function (selector) {
                if (selector == null)
                    selector = Functions.Identity;
                return this.Select(selector).Aggregate(function (a, b) { return (a < b) ? a : b; });
            },
            MaxBy: function (keySelector) {
                keySelector = Utils.CreateLambda(keySelector);
                return this.Aggregate(function (a, b) { return (keySelector(a) > keySelector(b)) ? a : b; });
            },
            MinBy: function (keySelector) {
                keySelector = Utils.CreateLambda(keySelector);
                return this.Aggregate(function (a, b) { return (keySelector(a) < keySelector(b)) ? a : b; });
            },
            // Overload:function()
            // Overload:function(selector)
            Sum: function (selector) {
                if (selector == null)
                    selector = Functions.Identity;
                return this.Select(selector).Aggregate(0, function (a, b) { return a + b; });
            },
            /* Paging Methods */
            ElementAt: function (index) {
                var value;
                var found = false;
                this.ForEach(function (x, i) {
                    if (i == index) {
                        value = x;
                        found = true;
                        return false;
                    }
                });
                if (!found)
                    throw new Error("index is less than 0 or greater than or equal to the number of elements in source.");
                return value;
            },
            ElementAtOrDefault: function (index, defaultValue) {
                var value;
                var found = false;
                this.ForEach(function (x, i) {
                    if (i == index) {
                        value = x;
                        found = true;
                        return false;
                    }
                });
                return (!found) ? defaultValue : value;
            },
            // Overload:function()
            // Overload:function(predicate)
            First: function (predicate) {
                if (predicate != null)
                    return this.Where(predicate).First();
                var value;
                var found = false;
                this.ForEach(function (x) {
                    value = x;
                    found = true;
                    return false;
                });
                if (!found)
                    throw new Error("First:No element satisfies the condition.");
                return value;
            },
            // Overload:function(defaultValue)
            // Overload:function(defaultValue,predicate)
            FirstOrDefault: function (defaultValue, predicate) {
                if (predicate != null)
                    return this.Where(predicate).FirstOrDefault(defaultValue);
                var value;
                var found = false;
                this.ForEach(function (x) {
                    value = x;
                    found = true;
                    return false;
                });
                return (!found) ? defaultValue : value;
            },
            // Overload:function()
            // Overload:function(predicate)
            Last: function (predicate) {
                if (predicate != null)
                    return this.Where(predicate).Last();
                var value;
                var found = false;
                this.ForEach(function (x) {
                    found = true;
                    value = x;
                });
                if (!found)
                    throw new Error("Last:No element satisfies the condition.");
                return value;
            },
            // Overload:function(defaultValue)
            // Overload:function(defaultValue,predicate)
            LastOrDefault: function (defaultValue, predicate) {
                if (predicate != null)
                    return this.Where(predicate).LastOrDefault(defaultValue);
                var value;
                var found = false;
                this.ForEach(function (x) {
                    found = true;
                    value = x;
                });
                return (!found) ? defaultValue : value;
            },
            // Overload:function()
            // Overload:function(predicate)
            Single: function (predicate) {
                if (predicate != null)
                    return this.Where(predicate).Single();
                var value;
                var found = false;
                this.ForEach(function (x) {
                    if (!found) {
                        found = true;
                        value = x;
                    }
                    else
                        throw new Error("Single:sequence contains more than one element.");
                });
                if (!found)
                    throw new Error("Single:No element satisfies the condition.");
                return value;
            },
            // Overload:function(defaultValue)
            // Overload:function(defaultValue,predicate)
            SingleOrDefault: function (defaultValue, predicate) {
                if (predicate != null)
                    return this.Where(predicate).SingleOrDefault(defaultValue);
                var value;
                var found = false;
                this.ForEach(function (x) {
                    if (!found) {
                        found = true;
                        value = x;
                    }
                    else
                        throw new Error("Single:sequence contains more than one element.");
                });
                return (!found) ? defaultValue : value;
            },
            Skip: function (count) {
                var source = this;
                return new Enumerable(function () {
                    var enumerator;
                    var index = 0;
                    return new IEnumerator(function () {
                        enumerator = source.GetEnumerator();
                        while (index++ < count && enumerator.MoveNext()) { }
                        ;
                    }, function () {
                        return (enumerator.MoveNext())
                            ? this.Yield(enumerator.Current())
                            : false;
                    }, function () { Utils.Dispose(enumerator); });
                });
            },
            // Overload:function(predicate<element>)
            // Overload:function(predicate<element,index>)
            SkipWhile: function (predicate) {
                predicate = Utils.CreateLambda(predicate);
                var source = this;
                return new Enumerable(function () {
                    var enumerator;
                    var index = 0;
                    var isSkipEnd = false;
                    return new IEnumerator(function () { enumerator = source.GetEnumerator(); }, function () {
                        while (!isSkipEnd) {
                            if (enumerator.MoveNext()) {
                                if (!predicate(enumerator.Current(), index++)) {
                                    isSkipEnd = true;
                                    return this.Yield(enumerator.Current());
                                }
                                continue;
                            }
                            else
                                return false;
                        }
                        return (enumerator.MoveNext())
                            ? this.Yield(enumerator.Current())
                            : false;
                    }, function () { Utils.Dispose(enumerator); });
                });
            },
            Take: function (count) {
                var source = this;
                return new Enumerable(function () {
                    var enumerator;
                    var index = 0;
                    return new IEnumerator(function () { enumerator = source.GetEnumerator(); }, function () {
                        return (index++ < count && enumerator.MoveNext())
                            ? this.Yield(enumerator.Current())
                            : false;
                    }, function () { Utils.Dispose(enumerator); });
                });
            },
            // Overload:function(predicate<element>)
            // Overload:function(predicate<element,index>)
            TakeWhile: function (predicate) {
                predicate = Utils.CreateLambda(predicate);
                var source = this;
                return new Enumerable(function () {
                    var enumerator;
                    var index = 0;
                    return new IEnumerator(function () { enumerator = source.GetEnumerator(); }, function () {
                        return (enumerator.MoveNext() && predicate(enumerator.Current(), index++))
                            ? this.Yield(enumerator.Current())
                            : false;
                    }, function () { Utils.Dispose(enumerator); });
                });
            },
            // Overload:function()
            // Overload:function(count)
            TakeExceptLast: function (count) {
                if (count == null)
                    count = 1;
                var source = this;
                return new Enumerable(function () {
                    if (count <= 0)
                        return source.GetEnumerator(); // do nothing
                    var enumerator;
                    var q = [];
                    return new IEnumerator(function () { enumerator = source.GetEnumerator(); }, function () {
                        while (enumerator.MoveNext()) {
                            if (q.length == count) {
                                q.push(enumerator.Current());
                                return this.Yield(q.shift());
                            }
                            q.push(enumerator.Current());
                        }
                        return false;
                    }, function () { Utils.Dispose(enumerator); });
                });
            },
            TakeFromLast: function (count) {
                if (count <= 0 || count == null)
                    return Enumerable.Empty();
                var source = this;
                return new Enumerable(function () {
                    var sourceEnumerator;
                    var enumerator;
                    var q = [];
                    return new IEnumerator(function () { sourceEnumerator = source.GetEnumerator(); }, function () {
                        while (sourceEnumerator.MoveNext()) {
                            if (q.length == count)
                                q.shift();
                            q.push(sourceEnumerator.Current());
                        }
                        if (enumerator == null) {
                            enumerator = Enumerable.From(q).GetEnumerator();
                        }
                        return (enumerator.MoveNext())
                            ? this.Yield(enumerator.Current())
                            : false;
                    }, function () { Utils.Dispose(enumerator); });
                });
            },
            IndexOf: function (item) {
                var found = null;
                this.ForEach(function (x, i) {
                    if (x === item) {
                        found = i;
                        return true;
                    }
                });
                return (found !== null) ? found : -1;
            },
            LastIndexOf: function (item) {
                var result = -1;
                this.ForEach(function (x, i) {
                    if (x === item)
                        result = i;
                });
                return result;
            },
            /* Convert Methods */
            ToArray: function () {
                var array = [];
                this.ForEach(function (x) { array.push(x); });
                return array;
            },
            // Overload:function(keySelector)
            // Overload:function(keySelector, elementSelector)
            // Overload:function(keySelector, elementSelector, compareSelector)
            ToLookup: function (keySelector, elementSelector, compareSelector) {
                keySelector = Utils.CreateLambda(keySelector);
                elementSelector = Utils.CreateLambda(elementSelector);
                compareSelector = Utils.CreateLambda(compareSelector);
                var dict = new Dictionary(compareSelector);
                this.ForEach(function (x) {
                    var key = keySelector(x);
                    var element = elementSelector(x);
                    var array = dict.Get(key);
                    if (array !== undefined)
                        array.push(element);
                    else
                        dict.Add(key, [element]);
                });
                return new Lookup(dict);
            },
            ToObject: function (keySelector, elementSelector) {
                keySelector = Utils.CreateLambda(keySelector);
                elementSelector = Utils.CreateLambda(elementSelector);
                var obj = {};
                this.ForEach(function (x) {
                    obj[keySelector(x)] = elementSelector(x);
                });
                return obj;
            },
            // Overload:function(keySelector, elementSelector)
            // Overload:function(keySelector, elementSelector, compareSelector)
            ToDictionary: function (keySelector, elementSelector, compareSelector) {
                keySelector = Utils.CreateLambda(keySelector);
                elementSelector = Utils.CreateLambda(elementSelector);
                compareSelector = Utils.CreateLambda(compareSelector);
                var dict = new Dictionary(compareSelector);
                this.ForEach(function (x) {
                    dict.Add(keySelector(x), elementSelector(x));
                });
                return dict;
            },
            // Overload:function()
            // Overload:function(replacer)
            // Overload:function(replacer, space)
            ToJSON: function (replacer, space) {
                return JSON.stringify(this.ToArray(), replacer, space);
            },
            // Overload:function()
            // Overload:function(separator)
            // Overload:function(separator,selector)
            ToString: function (separator, selector) {
                if (separator == null)
                    separator = "";
                if (selector == null)
                    selector = Functions.Identity;
                return this.Select(selector).ToArray().join(separator);
            },
            /* Action Methods */
            // Overload:function(action<element>)
            // Overload:function(action<element,index>)
            Do: function (action) {
                var source = this;
                action = Utils.CreateLambda(action);
                return new Enumerable(function () {
                    var enumerator;
                    var index = 0;
                    return new IEnumerator(function () { enumerator = source.GetEnumerator(); }, function () {
                        if (enumerator.MoveNext()) {
                            action(enumerator.Current(), index++);
                            return this.Yield(enumerator.Current());
                        }
                        return false;
                    }, function () { Utils.Dispose(enumerator); });
                });
            },
            // Overload:function(action<element>)
            // Overload:function(action<element,index>)
            // Overload:function(func<element,bool>)
            // Overload:function(func<element,index,bool>)
            ForEach: function (action) {
                action = Utils.CreateLambda(action);
                var index = 0;
                var enumerator = this.GetEnumerator();
                try {
                    while (enumerator.MoveNext()) {
                        if (action(enumerator.Current(), index++) === false)
                            break;
                    }
                }
                finally {
                    Utils.Dispose(enumerator);
                }
            },
            // Overload:function()
            // Overload:function(separator)
            // Overload:function(separator,selector)
            Write: function (separator, selector) {
                if (separator == null)
                    separator = "";
                selector = Utils.CreateLambda(selector);
                var isFirst = true;
                this.ForEach(function (item) {
                    if (isFirst)
                        isFirst = false;
                    else
                        document.write(separator);
                    document.write(selector(item));
                });
            },
            // Overload:function()
            // Overload:function(selector)
            WriteLine: function (selector) {
                selector = Utils.CreateLambda(selector);
                this.ForEach(function (item) {
                    document.write(selector(item));
                    document.write("<br />");
                });
            },
            Force: function () {
                var enumerator = this.GetEnumerator();
                try {
                    while (enumerator.MoveNext()) { }
                }
                finally {
                    Utils.Dispose(enumerator);
                }
            },
            /* Functional Methods */
            Let: function (func) {
                func = Utils.CreateLambda(func);
                var source = this;
                return new Enumerable(function () {
                    var enumerator;
                    return new IEnumerator(function () {
                        enumerator = Enumerable.From(func(source)).GetEnumerator();
                    }, function () {
                        return (enumerator.MoveNext())
                            ? this.Yield(enumerator.Current())
                            : false;
                    }, function () { Utils.Dispose(enumerator); });
                });
            },
            Share: function () {
                var source = this;
                var sharedEnumerator;
                return new Enumerable(function () {
                    return new IEnumerator(function () {
                        if (sharedEnumerator == null) {
                            sharedEnumerator = source.GetEnumerator();
                        }
                    }, function () {
                        return (sharedEnumerator.MoveNext())
                            ? this.Yield(sharedEnumerator.Current())
                            : false;
                    }, Functions.Blank);
                });
            },
            MemoizeAll: function () {
                var source = this;
                var cache;
                var enumerator;
                return new Enumerable(function () {
                    var index = -1;
                    return new IEnumerator(function () {
                        if (enumerator == null) {
                            enumerator = source.GetEnumerator();
                            cache = [];
                        }
                    }, function () {
                        index++;
                        if (cache.length <= index) {
                            return (enumerator.MoveNext())
                                ? this.Yield(cache[index] = enumerator.Current())
                                : false;
                        }
                        return this.Yield(cache[index]);
                    }, Functions.Blank);
                });
            },
            /* Error Handling Methods */
            Catch: function (handler) {
                handler = Utils.CreateLambda(handler);
                var source = this;
                return new Enumerable(function () {
                    var enumerator;
                    return new IEnumerator(function () { enumerator = source.GetEnumerator(); }, function () {
                        try {
                            return (enumerator.MoveNext())
                                ? this.Yield(enumerator.Current())
                                : false;
                        }
                        catch (e) {
                            handler(e);
                            return false;
                        }
                    }, function () { Utils.Dispose(enumerator); });
                });
            },
            Finally: function (finallyAction) {
                finallyAction = Utils.CreateLambda(finallyAction);
                var source = this;
                return new Enumerable(function () {
                    var enumerator;
                    return new IEnumerator(function () { enumerator = source.GetEnumerator(); }, function () {
                        return (enumerator.MoveNext())
                            ? this.Yield(enumerator.Current())
                            : false;
                    }, function () {
                        try {
                            Utils.Dispose(enumerator);
                        }
                        finally {
                            finallyAction();
                        }
                    });
                });
            },
            /* For Debug Methods */
            // Overload:function()
            // Overload:function(message)
            // Overload:function(message,selector)
            Trace: function (message, selector) {
                if (message == null)
                    message = "Trace";
                selector = Utils.CreateLambda(selector);
                return this.Do(function (item) {
                    console.log(message, ":", selector(item));
                });
            }
        };
    // private
    // static functions
    var Functions = {
        Identity: function (x) { return x; },
        True: function () { return true; },
        Blank: function () { }
    };
    // static const
    var Types = {
        Boolean: typeof true,
        Number: typeof 0,
        String: typeof "",
        Object: typeof {},
        Undefined: typeof undefined,
        Function: typeof function () { }
    };
    // static utility methods
    var Utils = {
        // Create anonymous function from lambda expression string
        CreateLambda: function (expression) {
            if (expression == null)
                return Functions.Identity;
            if (typeof expression == Types.String) {
                if (expression == "") {
                    return Functions.Identity;
                }
                else if (expression.indexOf("=>") == -1) {
                    return new Function("$,$$,$$$,$$$$", "return " + expression);
                }
                else {
                    var expr = expression.match(/^[(\s]*([^()]*?)[)\s]*=>(.*)/);
                    return new Function(expr[1], "return " + expr[2]);
                }
            }
            return expression;
        },
        IsIEnumerable: function (obj) {
            if (typeof Enumerator != Types.Undefined) {
                try {
                    new Enumerator(obj);
                    return true;
                }
                catch (e) { }
            }
            return false;
        },
        Compare: function (a, b) {
            return (a === b) ? 0
                : (a > b) ? 1
                    : -1;
        },
        Dispose: function (obj) {
            if (obj != null)
                obj.Dispose();
        }
    };
    // IEnumerator State
    var State = { Before: 0, Running: 1, After: 2 };
    // name "Enumerator" is conflict JScript's "Enumerator"
    var IEnumerator = function (initialize, tryGetNext, dispose) {
        var yielder = new Yielder();
        var state = State.Before;
        this.Current = yielder.Current;
        this.MoveNext = function () {
            try {
                switch (state) {
                    case State.Before:
                        state = State.Running;
                        initialize(); // fall through
                    case State.Running:
                        if (tryGetNext.apply(yielder)) {
                            return true;
                        }
                        else {
                            this.Dispose();
                            return false;
                        }
                    case State.After:
                        return false;
                }
            }
            catch (e) {
                this.Dispose();
                throw e;
            }
        };
        this.Dispose = function () {
            if (state != State.Running)
                return;
            try {
                dispose();
            }
            finally {
                state = State.After;
            }
        };
    };
    // for tryGetNext
    var Yielder = function () {
        var current = null;
        this.Current = function () { return current; };
        this.Yield = function (value) {
            current = value;
            return true;
        };
    };
    // for OrderBy/ThenBy
    var OrderedEnumerable = function (source, keySelector, descending, parent) {
        this.source = source;
        this.keySelector = Utils.CreateLambda(keySelector);
        this.descending = descending;
        this.parent = parent;
    };
    OrderedEnumerable.prototype = new Enumerable();
    OrderedEnumerable.prototype.CreateOrderedEnumerable = function (keySelector, descending) {
        return new OrderedEnumerable(this.source, keySelector, descending, this);
    };
    OrderedEnumerable.prototype.ThenBy = function (keySelector) {
        return this.CreateOrderedEnumerable(keySelector, false);
    };
    OrderedEnumerable.prototype.ThenByDescending = function (keySelector) {
        return this.CreateOrderedEnumerable(keySelector, true);
    };
    OrderedEnumerable.prototype.GetEnumerator = function () {
        var self = this;
        var buffer;
        var indexes;
        var index = 0;
        return new IEnumerator(function () {
            buffer = [];
            indexes = [];
            self.source.ForEach(function (item, index) {
                buffer.push(item);
                indexes.push(index);
            });
            var sortContext = SortContext.Create(self, null);
            sortContext.GenerateKeys(buffer);
            indexes.sort(function (a, b) { return sortContext.Compare(a, b); });
        }, function () {
            return (index < indexes.length)
                ? this.Yield(buffer[indexes[index++]])
                : false;
        }, Functions.Blank);
    };
    var SortContext = function (keySelector, descending, child) {
        this.keySelector = keySelector;
        this.descending = descending;
        this.child = child;
        this.keys = null;
    };
    SortContext.Create = function (orderedEnumerable, currentContext) {
        var context = new SortContext(orderedEnumerable.keySelector, orderedEnumerable.descending, currentContext);
        if (orderedEnumerable.parent != null)
            return SortContext.Create(orderedEnumerable.parent, context);
        return context;
    };
    SortContext.prototype.GenerateKeys = function (source) {
        var len = source.length;
        var keySelector = this.keySelector;
        var keys = new Array(len);
        for (var i = 0; i < len; i++)
            keys[i] = keySelector(source[i]);
        this.keys = keys;
        if (this.child != null)
            this.child.GenerateKeys(source);
    };
    SortContext.prototype.Compare = function (index1, index2) {
        var comparison = Utils.Compare(this.keys[index1], this.keys[index2]);
        if (comparison == 0) {
            if (this.child != null)
                return this.child.Compare(index1, index2);
            comparison = Utils.Compare(index1, index2);
        }
        return (this.descending) ? -comparison : comparison;
    };
    // optimize array or arraylike object
    var ArrayEnumerable = function (source) {
        this.source = source;
    };
    ArrayEnumerable.prototype = new Enumerable();
    ArrayEnumerable.prototype.Any = function (predicate) {
        return (predicate == null)
            ? (this.source.length > 0)
            : Enumerable.prototype.Any.apply(this, arguments);
    };
    ArrayEnumerable.prototype.Count = function (predicate) {
        return (predicate == null)
            ? this.source.length
            : Enumerable.prototype.Count.apply(this, arguments);
    };
    ArrayEnumerable.prototype.ElementAt = function (index) {
        return (0 <= index && index < this.source.length)
            ? this.source[index]
            : Enumerable.prototype.ElementAt.apply(this, arguments);
    };
    ArrayEnumerable.prototype.ElementAtOrDefault = function (index, defaultValue) {
        return (0 <= index && index < this.source.length)
            ? this.source[index]
            : defaultValue;
    };
    ArrayEnumerable.prototype.First = function (predicate) {
        return (predicate == null && this.source.length > 0)
            ? this.source[0]
            : Enumerable.prototype.First.apply(this, arguments);
    };
    ArrayEnumerable.prototype.FirstOrDefault = function (defaultValue, predicate) {
        if (predicate != null) {
            return Enumerable.prototype.FirstOrDefault.apply(this, arguments);
        }
        return this.source.length > 0 ? this.source[0] : defaultValue;
    };
    ArrayEnumerable.prototype.Last = function (predicate) {
        return (predicate == null && this.source.length > 0)
            ? this.source[this.source.length - 1]
            : Enumerable.prototype.Last.apply(this, arguments);
    };
    ArrayEnumerable.prototype.LastOrDefault = function (defaultValue, predicate) {
        if (predicate != null) {
            return Enumerable.prototype.LastOrDefault.apply(this, arguments);
        }
        return this.source.length > 0 ? this.source[this.source.length - 1] : defaultValue;
    };
    ArrayEnumerable.prototype.Skip = function (count) {
        var source = this.source;
        return new Enumerable(function () {
            var index;
            return new IEnumerator(function () { index = (count < 0) ? 0 : count; }, function () {
                return (index < source.length)
                    ? this.Yield(source[index++])
                    : false;
            }, Functions.Blank);
        });
    };
    ArrayEnumerable.prototype.TakeExceptLast = function (count) {
        if (count == null)
            count = 1;
        return this.Take(this.source.length - count);
    };
    ArrayEnumerable.prototype.TakeFromLast = function (count) {
        return this.Skip(this.source.length - count);
    };
    ArrayEnumerable.prototype.Reverse = function () {
        var source = this.source;
        return new Enumerable(function () {
            var index;
            return new IEnumerator(function () {
                index = source.length;
            }, function () {
                return (index > 0)
                    ? this.Yield(source[--index])
                    : false;
            }, Functions.Blank);
        });
    };
    ArrayEnumerable.prototype.SequenceEqual = function (second, compareSelector) {
        if ((second instanceof ArrayEnumerable || second instanceof Array)
            && compareSelector == null
            && Enumerable.From(second).Count() != this.Count()) {
            return false;
        }
        return Enumerable.prototype.SequenceEqual.apply(this, arguments);
    };
    ArrayEnumerable.prototype.ToString = function (separator, selector) {
        if (selector != null || !(this.source instanceof Array)) {
            return Enumerable.prototype.ToString.apply(this, arguments);
        }
        if (separator == null)
            separator = "";
        return this.source.join(separator);
    };
    ArrayEnumerable.prototype.GetEnumerator = function () {
        var source = this.source;
        var index = 0;
        return new IEnumerator(Functions.Blank, function () {
            return (index < source.length)
                ? this.Yield(source[index++])
                : false;
        }, Functions.Blank);
    };
    // Collections
    var Dictionary = (function () {
        // static utility methods
        var HasOwnProperty = function (target, key) {
            return Object.prototype.hasOwnProperty.call(target, key);
        };
        var ComputeHashCode = function (obj) {
            if (obj === null)
                return "null";
            if (obj === undefined)
                return "undefined";
            return (typeof obj.toString === Types.Function)
                ? obj.toString()
                : Object.prototype.toString.call(obj);
        };
        // LinkedList for Dictionary
        var HashEntry = function (key, value) {
            this.Key = key;
            this.Value = value;
            this.Prev = null;
            this.Next = null;
        };
        var EntryList = function () {
            this.First = null;
            this.Last = null;
        };
        EntryList.prototype =
            {
                AddLast: function (entry) {
                    if (this.Last != null) {
                        this.Last.Next = entry;
                        entry.Prev = this.Last;
                        this.Last = entry;
                    }
                    else
                        this.First = this.Last = entry;
                },
                Replace: function (entry, newEntry) {
                    if (entry.Prev != null) {
                        entry.Prev.Next = newEntry;
                        newEntry.Prev = entry.Prev;
                    }
                    else
                        this.First = newEntry;
                    if (entry.Next != null) {
                        entry.Next.Prev = newEntry;
                        newEntry.Next = entry.Next;
                    }
                    else
                        this.Last = newEntry;
                },
                Remove: function (entry) {
                    if (entry.Prev != null)
                        entry.Prev.Next = entry.Next;
                    else
                        this.First = entry.Next;
                    if (entry.Next != null)
                        entry.Next.Prev = entry.Prev;
                    else
                        this.Last = entry.Prev;
                }
            };
        // Overload:function()
        // Overload:function(compareSelector)
        var Dictionary = function (compareSelector) {
            this.count = 0;
            this.entryList = new EntryList();
            this.buckets = {}; // as Dictionary<string,List<object>>
            this.compareSelector = (compareSelector == null) ? Functions.Identity : compareSelector;
        };
        Dictionary.prototype =
            {
                Add: function (key, value) {
                    var compareKey = this.compareSelector(key);
                    var hash = ComputeHashCode(compareKey);
                    var entry = new HashEntry(key, value);
                    if (HasOwnProperty(this.buckets, hash)) {
                        var array = this.buckets[hash];
                        for (var i = 0; i < array.length; i++) {
                            if (this.compareSelector(array[i].Key) === compareKey) {
                                this.entryList.Replace(array[i], entry);
                                array[i] = entry;
                                return;
                            }
                        }
                        array.push(entry);
                    }
                    else {
                        this.buckets[hash] = [entry];
                    }
                    this.count++;
                    this.entryList.AddLast(entry);
                },
                Get: function (key) {
                    var compareKey = this.compareSelector(key);
                    var hash = ComputeHashCode(compareKey);
                    if (!HasOwnProperty(this.buckets, hash))
                        return undefined;
                    var array = this.buckets[hash];
                    for (var i = 0; i < array.length; i++) {
                        var entry = array[i];
                        if (this.compareSelector(entry.Key) === compareKey)
                            return entry.Value;
                    }
                    return undefined;
                },
                Set: function (key, value) {
                    var compareKey = this.compareSelector(key);
                    var hash = ComputeHashCode(compareKey);
                    if (HasOwnProperty(this.buckets, hash)) {
                        var array = this.buckets[hash];
                        for (var i = 0; i < array.length; i++) {
                            if (this.compareSelector(array[i].Key) === compareKey) {
                                var newEntry = new HashEntry(key, value);
                                this.entryList.Replace(array[i], newEntry);
                                array[i] = newEntry;
                                return true;
                            }
                        }
                    }
                    return false;
                },
                Contains: function (key) {
                    var compareKey = this.compareSelector(key);
                    var hash = ComputeHashCode(compareKey);
                    if (!HasOwnProperty(this.buckets, hash))
                        return false;
                    var array = this.buckets[hash];
                    for (var i = 0; i < array.length; i++) {
                        if (this.compareSelector(array[i].Key) === compareKey)
                            return true;
                    }
                    return false;
                },
                Clear: function () {
                    this.count = 0;
                    this.buckets = {};
                    this.entryList = new EntryList();
                },
                Remove: function (key) {
                    var compareKey = this.compareSelector(key);
                    var hash = ComputeHashCode(compareKey);
                    if (!HasOwnProperty(this.buckets, hash))
                        return;
                    var array = this.buckets[hash];
                    for (var i = 0; i < array.length; i++) {
                        if (this.compareSelector(array[i].Key) === compareKey) {
                            this.entryList.Remove(array[i]);
                            array.splice(i, 1);
                            if (array.length == 0)
                                delete this.buckets[hash];
                            this.count--;
                            return;
                        }
                    }
                },
                Count: function () {
                    return this.count;
                },
                ToEnumerable: function () {
                    var self = this;
                    return new Enumerable(function () {
                        var currentEntry;
                        return new IEnumerator(function () { currentEntry = self.entryList.First; }, function () {
                            if (currentEntry != null) {
                                var result = { Key: currentEntry.Key, Value: currentEntry.Value };
                                currentEntry = currentEntry.Next;
                                return this.Yield(result);
                            }
                            return false;
                        }, Functions.Blank);
                    });
                }
            };
        return Dictionary;
    })();
    // dictionary = Dictionary<TKey, TValue[]>
    var Lookup = function (dictionary) {
        this.Count = function () {
            return dictionary.Count();
        };
        this.Get = function (key) {
            return Enumerable.From(dictionary.Get(key));
        };
        this.Contains = function (key) {
            return dictionary.Contains(key);
        };
        this.ToEnumerable = function () {
            return dictionary.ToEnumerable().Select(function (kvp) {
                return new Grouping(kvp.Key, kvp.Value);
            });
        };
    };
    var Grouping = function (key, elements) {
        this.Key = function () {
            return key;
        };
        ArrayEnumerable.call(this, elements);
    };
    Grouping.prototype = new ArrayEnumerable();
    // out to global
    return Enumerable;
})();
