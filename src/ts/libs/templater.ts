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
					for(let j in self.interpolationRules){
						self.interpolationRules[j](elTemplate, templateData);
					}
					self.replaceHtml(elBlock, elTemplate);
				}
			}
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
		public static init = (templater) => {
			
			templater.addInterpolationRule(DefaultInterpolationRules.renderFieldsRule);
			templater.addInterpolationRule(DefaultInterpolationRules.foreachRule);
		}

		private static renderFieldsRule = (elTemplate, templateData) => {
			let flatData = Library.Utils.flattenJSON(templateData);
			for(let field in flatData){
				let value = flatData[field]; 
				elTemplate.innerHTML = elTemplate.innerHTML.replace(new RegExp("{{\\s*" + Library.Utils.camelToKebabCase(field) + "\\s*}}", 'g'), value);
			}
		}

		private static foreachRule = (elTemplate, templateData) => {
			let patternRegex = new RegExp("{{\\s*for .* in .*\\s*}}(.|\\n|\\r)*{{\\s*endfor\\s*}}", 'g');
			let arrayVarRegex = new RegExp("{{\\s*for .* in (.*)\\s*}}(.|\\n|\\r)*{{\\s*endfor\\s*}}", 'g');
			let objVarRegex = new RegExp("{{\\s*for (.*) in .*\\s*}}(.|\\n|\\r)*{{\\s*endfor\\s*}}", 'g');
			let repeatableHtmlRegex = new RegExp("{{\\s*for .* in .*\\s*}}((.|\\n|\\r)*){{\\s*endfor\\s*}}", 'g');

			let foreachMatches = elTemplate.innerHTML.match(patternRegex);
			for(let m in foreachMatches){
				let resultHtml = "";
				let foreachTemplate = foreachMatches[m];

				let arrayVar = foreachTemplate.replace(arrayVarRegex, "$1");
				let objVar = foreachTemplate.replace(objVarRegex, "$1");
				let repeatableHtml = foreachTemplate.replace(repeatableHtmlRegex, "$1");
				for(let i in templateData[arrayVar]){
					let objVarData = templateData[arrayVar][i];
					let rowHtml = repeatableHtml;
					for(let field in templateData[arrayVar][i]){
						rowHtml = rowHtml.replace(new RegExp("{{\\s*" + objVar + "." + Library.Utils.camelToKebabCase(field) + "\\s*}}", 'g'), templateData[arrayVar][i][field])
					}
					resultHtml += rowHtml;
				}

				elTemplate.innerHTML = elTemplate.innerHTML.replace(foreachTemplate, resultHtml);
			}
		}
	}
}