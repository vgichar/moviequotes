/// <reference path="../_references.ts" />

module Library{
	export class Router{
		private routeCache = {};
		private routeCacheSize = 100;
		private routeMap = {};
		private notFoundView;
		private defaultTransformation;
		private onLoadingCallbacks = [];
		private onLoadedCallbacks = [];

		constructor(){
			this.bootstrap();
		}

		private bootstrap = () => {
			let self = this;

			$(window).on("load hashchange", function(){
				let route = self.getCurrentRoute();
				let view = self.getViewOfRoute(route);
				let args = self.getArgumentsOfRoute(route);
				let entry = self.getRouteEntry(route);

				let rtViews = document.getElementsByTagName('rtview');

				for(let i in rtViews){
					rtViews[i].className = rtViews[i].className ? rtViews[i].className.replace("loaded", ""): "";
					rtViews[i].className += "loading";
				}

				document.body.className = document.body.className ? document.body.className.replace("loaded", ""): "";
				document.body.className += "loading";

				for(let i in self.onLoadingCallbacks){
					self.onLoadingCallbacks[i](route);
				}

				Library.Utils.loadFile(view, function(childViewHtml){
					if(entry.controller && entry.controller.beforeLoad){
						entry.controller.beforeLoad(route, args);
					}

					for(let i in rtViews){
						rtViews[i].className = rtViews[i].className ? rtViews[i].className.replace("loading", ""): "";
						rtViews[i].className += "loaded";
						rtViews[i].innerHTML = childViewHtml;
					}
					
					document.body.className = document.body.className ? document.body.className.replace("loading", ""): "";
					document.body.className += "loaded";

					for(let i in self.onLoadedCallbacks){
						self.onLoadedCallbacks[i](route);
					}

					if(entry.controller && entry.controller.afterLoad){
						entry.controller.afterLoad(route, args);
					}
				}, function(){
					$.get(self.notFoundView).done(function(errorViewHtml){
						for(let i in rtViews){
							rtViews[i].innerHTML = errorViewHtml;
						}
					});
				});
			})
		}

		public go = (route) => {
			window.location.href = this.appendHahsbang(route);
		}

		public back = () => {
			window.history.back();
		}

		public register = (route, view, controller = undefined) => {
			route = this.prepRouteForQuerying(route);
			this.routeMap[route] = {view : view, controller : controller, route: route };
		}

		public registerNotFound = (view) => {
			this.notFoundView = view;
		}

		public defaultConvention = (defaultTransformation: Function) => {
			this.defaultTransformation = defaultTransformation;
		}

		public onLoading = (callback: Function) => {
			this.onLoadingCallbacks.push(callback);
		}

		public onLoaded = (callback: Function) => {
			this.onLoadedCallbacks.push(callback);
		}

		private appendHahsbang = (route) => {
			
			route = route.indexOf("#!") < 0 ? "#!" + route : route;
			route = route.indexOf("/") < 0 ? "/" + route : route;
			route = route.indexOf("/#!/") != 0 ? route.replace("/#!", "/#!/") : route;
			
			return route;
		}

		private prepRouteForQuerying = (route) => {
			return route ? route.replace("/", "") : route;
		}

		private getCurrentRoute = () => {
			let urlParts = window.location.href.split("#!");
			let route = urlParts.length == 2 ? urlParts[1] : "/";
			route = route.length > 0 ? route : "/";
			route = this.prepRouteForQuerying(route);

			return route;
		}

		private getViewOfRoute = (route) => {
			let self = this;
			let entry = self.getRouteEntry(route);
			let view = entry ? entry.view : undefined;

			if(!view){
				if(self.defaultTransformation){
					view = self.defaultTransformation(route);
				}
			}

			return view;
		}

		private getArgumentsOfRoute = (route) => {
			let self = this;
			let entry = self.getRouteEntry(route);

			return entry ? self.getRouteArguments(route, entry.route) : {};
		}

		private getRouteEntry = (route) => {
			let self = this;
			let entry = self.routeCache[route] || self.routeMap[route];
			let entryRoute = route;

			if(!entry){
				entryRoute = self.getRouteEntryWithWildcard(route);
				if(entryRoute){
					entry = self.routeMap[entryRoute];
				}
			}

			if(entry){
				self.routeCache[route] = entry;
			}

			return entry;
		}

		private getRouteEntryWithWildcard = (route) => {
			let self = this;
			let routeParts = route.split("/");
			let mapKeys = Object.keys(self.routeMap);

			for(let k in mapKeys){
				let key = mapKeys[k];
				let keyParts = key.split("/");

				if(routeParts.length != keyParts.length){
					continue;
				}

				let wildcardsMatch = key.match(new RegExp("{.*}", "g"));
				if(wildcardsMatch){
					let numOfWildcards = wildcardsMatch.length;

					for(let i = 1; i < numOfWildcards + 1; i++){
						let subroute = routeParts.slice(0, routeParts.length - i).join("/");
						let subrouteWild = Library.Utils.initArray(i, "/{.*}").join("");

							let findKey = key.match(new RegExp(subroute + subrouteWild));
							if(findKey){
								return key
						}
					}
				}
			}

			return undefined;
		}

		private getRouteArguments = (route, routeKey) => {
			let resultObj = {};
			let routeParts = route.split("/");
			let routeKeyParts = routeKey.split("/");
			for(let i = 0; i < routeParts.length; i++){
				if(routeKeyParts[i].match(/\{.*\}/g)){
					resultObj[routeKeyParts[i].replace("{", "").replace("}", "")] = routeParts[i];
				}
			}

			return resultObj;
		}
	}
}