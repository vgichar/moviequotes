/// <reference path="../../../typings/tsd.d.ts" />

module Library{
	export class Templater{
		private templatesPath = "";
		private blocks = [];
		private templates = [];
		private templateCallbacks = [];
		private prevBlocksCount = 0;

		constructor(){
			this.bootstrap();
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

				self.setVariablesAsAttributes();
				self.injectTemplates();
			})
		}

		public template = (name, variables) => {
			let self = this;
			self.templateCallbacks.push(function(){
				variables = self.flattenJSON(variables);
				let block = self.blocks[name];
				for(let v in variables){
					block.setAttribute(v.replace(".", "-"), variables[v]);
				}
			});
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
					this.loadTemplate(name, function(e, xhr){

						if (xhr.readyState === 4) {
							if (xhr.status === 200) {
								let elTemplateParent = document.createElement("div");
								elTemplateParent.innerHTML = xhr.responseText;
								let elTemplate = elTemplateParent.firstChild;
								document.body.appendChild(elTemplate);

								countLoaded++;
								if(shouldLoad == countLoaded){
									onLoadAll();
								}
							}
						}
					})
				}
			}

			if(shouldLoad == 0){
				onLoadAll();
				return false;
			}

			return true;
		}

		private loadTemplate = (fileName, onLoad) => {
			let filePath = this.templatesPath + "/" + fileName + ".html";

			var xhr = new XMLHttpRequest();
			xhr.open("GET", filePath, true);
			xhr.onload = function(e){
				onLoad(e, xhr);
			};
			xhr.send(null);
		}

		private setVariablesAsAttributes = () => {
			for(let i in this.templateCallbacks){
				this.templateCallbacks[i]();
			}
			this.templateCallbacks = [];			
		}

		private injectTemplates = () => {
			let self = this;
			for(let i in self.blocks){
				let name = i;

				let elBlock = self.blocks[name];
				let elTemplate = self.templates[name];

				if(elBlock && elTemplate){
					self.replaceVariables(elBlock, elTemplate);
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

		private replaceVariables = (elBlock, elTemplate) => {
			let attrs = elBlock.attributes;
			for(let i = 0; i < attrs.length; i++){
				elTemplate.innerHTML = elTemplate.innerHTML.replace("{{" + attrs[i].name.replace("-", ".") + "}}", attrs[i].value);
			}
		}

		private flattenJSON = (data) => {
		    var result = {};
		    function recurse (cur, prop) {
		        if (Object(cur) !== cur) {
		            result[prop] = cur;
		        } else if (Array.isArray(cur)) {
		             for(var i=0, l=cur.length; i<l; i++)
		                 recurse(cur[i], prop + "[" + i + "]");
		            if (l == 0)
		                result[prop] = [];
		        } else {
		            var isEmpty = true;
		            for (var p in cur) {
		                isEmpty = false;
		                recurse(cur[p], prop ? prop+"."+p : p);
		            }
		            if (isEmpty && prop)
		                result[prop] = {};
		        }
		    }
		    recurse(data, "");
		    return result;
		}
	}
}