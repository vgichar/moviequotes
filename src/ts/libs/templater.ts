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

			let hadAny = self.preloadTemplates(function(){
				if(hadAny){
					self.work();
					return;
				}
				self.scanBlocks();

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
			let self = this;
			let countLoaded = 0;
			let shouldLoad = 0;
			for(let name in this.blocks){
				shouldLoad++;
				let path = "templates/" + name + ".html";
				Library.Utils.loadFile(path, function(data){
					let elTemplateParent = document.createElement("div");
					elTemplateParent.innerHTML = data;
					let elTemplate = elTemplateParent.firstChild;
					document.body.appendChild(elTemplate);
					self.templates[name] = elTemplate;

					countLoaded++;
					if(shouldLoad == countLoaded){
						onLoadAll();
					}
				}, undefined);
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
			templater.addInterpolationRule(DefaultInterpolationRules.ifElseRule);
			templater.addInterpolationRule(DefaultInterpolationRules.foreachRule);
			templater.addInterpolationRule(DefaultInterpolationRules.renderFieldsRule);

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
			let startRegex = new RegExp("{{\\s*for (.*) in (.*)\\s*}}", 'g');
			let endRegex = new RegExp("{{\\s*endfor\\s*}}", 'g');

			return RuleUtil.scopefulRule(html, templateData, "for", "endfor", startRegex, endRegex, function(html, templateData, paddingFront, paddingBack){
				let startPadded = "{{\\s*" + paddingFront + "for" + paddingBack + " (.*) in (.*)\\s*}}";
				let endPadded = "{{\\s*" + paddingFront + "endfor" + paddingBack + "\\s*}}";
				let contentWithLazyEnd = "(((.|\\n|\\r)(?!" + endPadded + "))*.)";

				let regex = new RegExp(startPadded  + contentWithLazyEnd + endPadded, 'g');
				let scope = new Scope(templateData);

				let blockMatches = html.match(regex);
				for(let m in blockMatches){
					let resultHtml = "";
					let match = blockMatches[m];

					let objVar = match.replace(regex, "$1");
					let arrayVar = match.replace(regex, "$2");
					let repeatableHtml = match.replace(regex, "$3");

					let arr = scope.getValue(arrayVar);
					repeatableHtml = repeatableHtml.replace(new RegExp(objVar + "(?=(?!.*{{.*}}).*}})", 'g'), arrayVar + "[{{#}}]")
					for(let k in arr){
						resultHtml += repeatableHtml.replace(/{{#}}/g, k)
						resultHtml = resultHtml.replace(new RegExp("{{\\s*\\$index\\s*}}", 'g'), k);
						resultHtml = resultHtml.replace(new RegExp("{{\\s*\\$index1\\s*}}", 'g'), (parseInt(k) + 1).toString());
					}
					html = html.replace(match, resultHtml);
				}

				return html;
			});
		}

		private static ifElseRule = (html, templateData) => {
			let startRegex = new RegExp("{{\\s*if\\s*(.*)\\s*}}", 'g');
			let endRegex = new RegExp("{{\\s*endif\\s*}}", 'g');
			let elseRegex = new RegExp("{{\\s*else\\s*}}", 'g');
			
			return RuleUtil.scopefulRule(html, templateData, "if", "endif", startRegex, endRegex, function(html, templateData, paddingFront, paddingBack){
				let startPadded = "{{\\s*" + paddingFront + "if" + paddingBack + " (.*)\\s*}}";
				let endPadded = "{{\\s*" + paddingFront + "endif" + paddingBack + "\\s*}}";
				let contentWithLazyEnd = "(((.|\\n|\\r)(?!" + endPadded + "))*.)";

				let regex = new RegExp(startPadded  + contentWithLazyEnd + endPadded, 'g');
				let scope = new Scope(templateData);

				let blockMatches = html.match(regex);
				for(let m in blockMatches){
					let match = blockMatches[m];

					let hasElse = match.match(elseRegex);
					hasElse = hasElse && hasElse != null && hasElse.length > 0;
					let condition = match.replace(regex, "$1");
					condition = Library.Utils.htmlEncode(condition);

					let block = match.replace(regex, "$2");
					let blocks = [block];
					if(hasElse){
						blocks = block.split(new RegExp("{{\\s*else\\s*}}", 'g'));
					}

					scope.makeGlobal();
					
					if(eval(condition)){
						html = html.replace(match, blocks[0]);
					}else if(blocks.length == 2){
						html = html.replace(match, blocks[1]);
					}else{
						html = html.replace(match, "");
					}

					scope.makeLocal();

				}

				return html;
			});
		}

		private static renderAnythingRule = (html, templateData) => {
			let regex = new RegExp("{{(.*)}}", 'g');
			let matches = html.match(regex);

			let scope = new Scope(templateData);
			scope.makeGlobal();

			for(let m in matches){
				let match = matches[m];
				let code = match.replace(regex, "$1");

				html = html.replace(match, eval(code));
			}
			
			scope.makeLocal()

			return html;
		}
	}

	class RuleUtil{
		public static scopefulRule = (html, templateData, startScopeWord, endScopeWord, startScopeRegex, endScopeRegex, logicCallback) => {
			let originalHtml = html;
			let scope = new Scope(templateData);

			let regionMatches = html.match(new RegExp(startScopeRegex.source + "|" + endScopeRegex.source, 'g'));
			let level = 0;
			let levelStack = {};
			let max = 0;
			for(let m in regionMatches){
				if(regionMatches[m].indexOf(endScopeWord) < 0){
					if(!levelStack[level]){
						levelStack[level] = 0;
					}
					html = html.replace(regionMatches[m], regionMatches[m].replace(startScopeWord, level + startScopeWord + levelStack[level]))
					level++;
					max = max < level ? level : max;
				}
				else{
					level--;
					html = html.replace(regionMatches[m], regionMatches[m].replace(endScopeWord, level + endScopeWord + levelStack[level]))
					levelStack[level]++;
				}
			}
			for(let i = 0; i < max; i++){
				for(let j = 0; j < levelStack[i]; j++){
					html = logicCallback(html, templateData, i, j);
				}
			}
			return html;
		}
	}

	class Scope{
		private data: any;
		private flatData: any;
		private cached: boolean;

		public constructor(data){
			this.data = data;
			this.cached = false;
		}

		public setValue(key, value){
			eval("this.data." + key + "=" + value);
			this.cached = false;
		}

		public unsetValue(key){
			eval("this.data." + key + "=undefined");
			this.cached = false;
		}

		public getValue(key){
			return eval("this.data." + key);
		}

		public getData(){
			return this.data;
		}

		public getFlatData(){
			if(this.cached)
				return this.flatData;

			this.flatData = Library.Utils.flattenJSON(this.data);
			this.cached = true;
			return this.flatData;
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
	}
}