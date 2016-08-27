/// <reference path="../../../typings/tsd.d.ts" />
var Library;
(function (Library) {
    var Router = (function () {
        function Router() {
            var _this = this;
            this.routeMap = {};
            this.onLoadingCallbacks = [];
            this.onLoadedCallbacks = [];
            this.bootstrap = function () {
                var self = _this;
                $(window).on("load hashchange", function () {
                    var route = self.getCurrentRoute();
                    var view = self.routeMap[route];
                    if (!view && self.defaultTransformation) {
                        view = self.defaultTransformation(route);
                    }
                    var rtViews = document.getElementsByTagName('rtview');
                    for (var i in rtViews) {
                        rtViews[i].className = rtViews[i].className ? rtViews[i].className.replace("loaded", "") : "";
                        rtViews[i].className += "loading";
                    }
                    for (var i in self.onLoadingCallbacks) {
                        self.onLoadingCallbacks[i]();
                    }
                    $.get(view).done(function (childViewHtml) {
                        for (var i in rtViews) {
                            rtViews[i].className = rtViews[i].className ? rtViews[i].className.replace("loading", "") : "";
                            rtViews[i].className += "loaded";
                            rtViews[i].innerHTML = childViewHtml;
                        }
                        for (var i in self.onLoadedCallbacks) {
                            self.onLoadedCallbacks[i]();
                        }
                    }).fail(function () {
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
            this.register = function (route, view) {
                route = _this.prepRouteForQuerying(route);
                _this.routeMap[route] = view;
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
            this.bootstrap();
        }
        return Router;
    }());
    Library.Router = Router;
})(Library || (Library = {}));
/// <reference path="../../../typings/tsd.d.ts" />
var Library;
(function (Library) {
    var Templater = (function () {
        function Templater() {
            var _this = this;
            this.templatesPath = "";
            this.blocks = [];
            this.templates = [];
            this.templateCallbacks = [];
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
                self.templateCallbacks.push(function () {
                    variables = self.flattenJSON(variables);
                    var block = self.blocks[name];
                    for (var v in variables) {
                        block.setAttribute(v.replace(".", "-"), variables[v]);
                    }
                });
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
                        _this.loadTemplate(name_2, function (e, xhr) {
                            if (xhr.readyState === 4) {
                                if (xhr.status === 200) {
                                    var elTemplateParent = document.createElement("div");
                                    elTemplateParent.innerHTML = xhr.responseText;
                                    var elTemplate = elTemplateParent.firstChild;
                                    document.body.appendChild(elTemplate);
                                    countLoaded++;
                                    if (shouldLoad == countLoaded) {
                                        onLoadAll();
                                    }
                                }
                            }
                        });
                    }
                }
                if (shouldLoad == 0) {
                    onLoadAll();
                    return false;
                }
                return true;
            };
            this.loadTemplate = function (fileName, onLoad) {
                var filePath = _this.templatesPath + "/" + fileName + ".html";
                var xhr = new XMLHttpRequest();
                xhr.open("GET", filePath, true);
                xhr.onload = function (e) {
                    onLoad(e, xhr);
                };
                xhr.send(null);
            };
            this.setVariablesAsAttributes = function () {
                for (var i in _this.templateCallbacks) {
                    _this.templateCallbacks[i]();
                }
                _this.templateCallbacks = [];
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
                    if (nodes[i].nodeName == "SCRIPT") {
                        var scriptTag = document.createElement("script");
                        scriptTag.innerHTML = nodes[i].innerHTML;
                        elBlock.parentElement.insertBefore(scriptTag, elBlock);
                    }
                    else if (nodes[i].nodeName == "#text") {
                        var textNode = document.createTextNode(nodes[i].textContent);
                        elBlock.parentElement.insertBefore(textNode, elBlock);
                    }
                    else {
                        elBlock.parentElement.insertBefore(nodes[i], elBlock);
                    }
                }
                elBlock.remove();
                elTemplate.remove();
            };
            this.replaceVariables = function (elBlock, elTemplate) {
                var attrs = elBlock.attributes;
                for (var i = 0; i < attrs.length; i++) {
                    elTemplate.innerHTML = elTemplate.innerHTML.replace("{{" + attrs[i].name.replace("-", ".") + "}}", attrs[i].value);
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
/// <reference path="../../../typings/tsd.d.ts" />
var Views;
(function (Views) {
    var Home = (function () {
        function Home() {
        }
        return Home;
    }());
    Views.Home = Home;
})(Views || (Views = {}));
/// <reference path="../../../typings/tsd.d.ts" />
/// <reference path="../libs/router.ts" />
/// <reference path="../libs/templater.ts" />
var Views;
(function (Views) {
    var Index = (function () {
        function Index() {
            this.boot = function () {
                Index.Templater = new Library.Templater();
                Index.Router = new Library.Router();
                Index.Router.register("/", "home.html");
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
new Views.Index().boot();
