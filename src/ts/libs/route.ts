/// <reference path="../../../typings/tsd.d.ts" />

module Library{
	export class Router{
		public routeMap = {};
		public notFoundView;
		public defaultTransformation;
		public onLoadingCallbacks = [];
		public onLoadedCallbacks = [];

		constructor(){
			this.bootstrap();
		}

		private bootstrap = () => {
			let self = this;

			$(window).on("load hashchange", function(){
				let route = self.getCurrentRoute();
				let view = self.routeMap[route];

				if(!view && self.defaultTransformation){
					view = self.defaultTransformation(route);
				}

				let rtViews = document.getElementsByTagName('rtview');

				for(let i in rtViews){
					rtViews[i].className = rtViews[i].className ? rtViews[i].className.replace("loaded", ""): "";
					rtViews[i].className += "loading";
				}

				for(let i in self.onLoadingCallbacks){
					self.onLoadingCallbacks[i]();
				}

				$.get(view).done(function(childViewHtml){
					for(let i in rtViews){
						rtViews[i].className = rtViews[i].className ? rtViews[i].className.replace("loading", ""): "";
						rtViews[i].className += "loaded";
						rtViews[i].innerHTML = childViewHtml;
					}

					for(let i in self.onLoadedCallbacks){
						self.onLoadedCallbacks[i]();
					}
				}).fail(function(){
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

		public register = (route, view) => {
			route = this.prepRouteForQuerying(route);
			this.routeMap[route] = view;
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
	}
}