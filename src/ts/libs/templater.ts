/// <reference path="../_references.ts" />

module Library{
	export class Templater{
		private templatesPath = "";
		private blocks = [];
		private templates = [];
		private templatesData = [];
		private prevBlocksCount = 0;

		private interpolationRules: Function[] = [];

		constructor(){
			this.bootstrap();
			DefaultInterpolationRules.init(this);
		}

		private bootstrap = () => {
			this.setTemplatesDirectory("templates");
		}

		public setTemplatesDirectory = (dir) => {
			this.templatesPath = dir;
		}

		public work = () => {
			let self = this;
			self.scanBlocks();
			self.scanTemplates();

			let hadAny = self.preloadTemplates(function(){
				if(hadAny){
					self.work();
					return;
				}
				self.scanBlocks();
				self.scanTemplates();

				self.injectTemplates();
			})
		}

		public template = (name, variables) => {
			let self = this;
			self.templatesData[name] = variables;
		}

		public addInterpolationRule = (callback: Function) => {
			this.interpolationRules.push(callback);
		}

		private scanBlocks = () =>{
			this.scanByTagName(this.blocks, "block");
		}

		private scanTemplates = () =>{
			this.scanByTagName(this.templates, "template");
		}

		private scanByTagName = (container, tagName) => {

			for(let i in container){
				if(!container[i].parentNode){
					delete container[i];
				}
			}

			let elements = document.getElementsByTagName(tagName);
			for(let i = 0; i < elements.length; i++){
				let name = elements[i].getAttribute("name");
				container[name] = elements[i];
			}
		}

		private preloadTemplates = (onLoadAll) =>{
			let countLoaded = 0;
			let shouldLoad = 0;
			for(let name in this.blocks){
				let templateExists = this.templates[name] != undefined;
				if(!templateExists){
					shouldLoad++;
					let path = "templates/" + name + ".html";
					Library.Utils.loadFile(path, function(data){
						let elTemplateParent = document.createElement("div");
						elTemplateParent.innerHTML = data;
						let elTemplate = elTemplateParent.firstChild;
						document.body.appendChild(elTemplate);

						countLoaded++;
						if(shouldLoad == countLoaded){
							onLoadAll();
						}
					}, undefined);
				}
			}

			if(shouldLoad == 0){
				onLoadAll();
				return false;
			}

			return true;
		}

		private injectTemplates = () => {
			let self = this;
			for(let i in self.blocks){
				let name = i;

				let elBlock = self.blocks[name];
				let elTemplate = self.templates[name];
				let templateData = self.templatesData[name];

				if(elBlock && elTemplate){
					elTemplate.innerHTML = self.interpolate(elTemplate.innerHTML, templateData)
					self.replaceHtml(elBlock, elTemplate);
				}
			}
		}

		public interpolate = (html, data) => {
			for(let j in this.interpolationRules){
				html = this.interpolationRules[j](html, data);
			}
			return html;
		}

		private replaceHtml = (elBlock, elTemplate) => {
			let elTemplateSubstituteNode = document.createElement("div");
			elTemplateSubstituteNode.innerHTML = elTemplate.innerHTML;

			let nodes = elTemplateSubstituteNode.childNodes;

			for(let i = 0; i < nodes.length; i++){
				let node: any = nodes[i];
				if(node.nodeName == "SCRIPT")
				{
					let scriptTag = document.createElement("script");
					scriptTag.innerHTML = node.innerHTML;
					elBlock.parentElement.insertBefore(scriptTag, elBlock);
				}
				else if(nodes[i].nodeName == "#text"){
					let textNode = document.createTextNode(node.textContent);
					elBlock.parentElement.insertBefore(textNode, elBlock);
				}
				else
				{
					elBlock.parentElement.insertBefore(node, elBlock);
				}
			}
			elBlock.remove();
			elTemplate.remove();
		}
	}


	class DefaultInterpolationRules{
		private static templater: Templater;

		public static init = (templater) => {
			DefaultInterpolationRules.templater = templater;
			templater.addInterpolationRule(DefaultInterpolationRules.renderFieldsRule);
			templater.addInterpolationRule(DefaultInterpolationRules.foreachRule);
			templater.addInterpolationRule(DefaultInterpolationRules.ifElseRule);

			templater.addInterpolationRule(DefaultInterpolationRules.renderAnythingRule);
		}

		private static renderFieldsRule = (html, templateData) => {
			let scope = new Scope(templateData);
			let flatData = scope.getFlatData();
			for(let field in flatData){
				let value = flatData[field];
				html = html.replace(new RegExp("{{\\s*" + Library.Utils.escapeRegExp(field) + "\\s*}}", 'g'), value);
			}

			return html;
		}

		private static foreachRule = (html, templateData) => {
			let patternRegex = new RegExp("{{\\s*for .* in .*\\s*}}(.|\\n|\\r)*{{\\s*endfor\\s*}}", 'g');
			let arrayVarRegex = new RegExp("{{\\s*for .* in (.*)\\s*}}(.|\\n|\\r)*{{\\s*endfor\\s*}}", 'g');
			let objVarRegex = new RegExp("{{\\s*for (.*) in .*\\s*}}(.|\\n|\\r)*{{\\s*endfor\\s*}}", 'g');
			let repeatableHtmlRegex = new RegExp("{{\\s*for .* in .*\\s*}}((.|\\n|\\r)*){{\\s*endfor\\s*}}", 'g');

			let foreachMatches = html.match(patternRegex);
			for(let m in foreachMatches){
				let resultHtml = "";
				let foreachTemplate = foreachMatches[m];

				let arrayVar = foreachTemplate.replace(arrayVarRegex, "$1"); // example movie.quotes
				let objVar = foreachTemplate.replace(objVarRegex, "$1"); // example quote // scope temp
				let repeatableHtml = foreachTemplate.replace(repeatableHtmlRegex, "$1"); // example {{quote.text}}

				let scope = new Scope(templateData);

				let arr = scope.getValue(arrayVar);
				let counter = 0;
				for(let i in arr){
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
		}

		private static ifElseRule = (html, templateData) => {
			let ifEndifRegion = new RegExp("{{\\s*if\\s*(.*)\\s*}}((.|\\n|\\r)*){{\\s*endif\\s*}}", 'g');
			let elseRegex = new RegExp("{{\\s*else\\s*}}", 'g');

			let matches = html.match(ifEndifRegion);
			let scope = new Scope(templateData);
			for(let m in matches){
				let match = matches[m];
				let hasElse = match.match(elseRegex).length > 0;

				let condition = match.replace(ifEndifRegion, "$1");
				condition = Library.Utils.htmlEncode(condition);

				let block = match.replace(ifEndifRegion, "$2");
				let blocks = [block];
				if(hasElse){
					blocks = block.split(new RegExp("{{\\s*else\\s*}}", 'g'));
				}

				scope.makeGlobal();
				
				if(eval(condition)){
					html = html.replace(match, blocks[0]);
				}else if(blocks.length == 2){
					html = html.replace(match, blocks[1]);
				}

				scope.makeLocal();
			}

			return html;
		}

		private static renderAnythingRule = (html, templateData) => {
			let regex = new RegExp("{{(.*)}}", 'g');
			let codeRegex = new RegExp("{{(.*)}}", 'g');
			let matches = html.match(regex);

			let scope = new Scope(templateData);
			scope.makeGlobal();

			for(let m in matches){
				let match = matches[m];
				let code = match.replace(codeRegex, "$1");

				html = html.replace(match, eval(code));
			}

			scope.makeLocal()

			return html;
		}
	}

	class Scope{
		private data: any;

		public constructor(data){
			this.data = data;
		}

		public setValue(key, value){
			this.gv(this.data, key, value);
		}

		public unsetValue(key){
			this.gvf(this.data, key, undefined);
		}

		public getValue(key){
			return this.gv(this.data, key);
		}

		public getData(){
			return this.data;
		}

		public getFlatData(){
			return Library.Utils.flattenJSON(this.data);
		}

		public makeGlobal(){
			for(let i in this.data){
				window[i] = this.data[i];
			}
		}

		public makeLocal(){
			for(let i in this.data){
				delete window[i];
			}
		}

		private gv(d, k, v = undefined){
			if(k.indexOf(".") >= 0){
				let firstKey = k.split('.')[0];
				let newKey = k.substring(firstKey.length + 1, k.length);
				return this.gv(d[firstKey], newKey, v);
			}
			if(v != undefined){
				d[k] = v;
			}
			return d[k];
		}

		private gvf(d, k, v){
			if(k.indexOf(".") >= 0){
				let firstKey = k.split('.')[0];
				let newKey = k.substring(firstKey.length + 1, k.length);
				return this.gv(d[firstKey], newKey, v);
			}
			d[k] = v;
			return d[k];
		}
	}
}