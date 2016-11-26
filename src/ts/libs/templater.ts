/// <reference path="../_references.ts" />

module Library{
	export class Template{
		public id: string;
		public blockName: string;
		public data: {};
		public block: any;
		public template: any;

		public render = () => {
			let html = this.template.innerHTML;
			this.block.innerHTML = "";
			this.replaceHtml(this.block, html);
		}

		private replaceHtml(elBlock, html){
			let elTemplateSubstituteNode = document.createElement("div");
			elTemplateSubstituteNode.innerHTML = html;

			let nodes = elTemplateSubstituteNode.childNodes;

			for(let i = 0; i < nodes.length; i++){
				let node: any = nodes[i];
				if(node.nodeName == "SCRIPT")
				{
					let scriptTag = document.createElement("script");
					scriptTag.innerHTML = node.innerHTML;
					elBlock.appendChild(scriptTag, elBlock);
				}
				else if(nodes[i].nodeName == "#text"){
					let textNode = document.createTextNode(node.textContent);
					elBlock.appendChild(textNode, elBlock);
				}
				else
				{
					elBlock.appendChild(node, elBlock);
				}
			}
		}
	}

	export class Templater{
		private templates: Template[];
		private templateData: {};

		constructor(){
			this.templates = [];
			this.templateData = {};
		}

		public render = () => {
			this.scanFromRoot(window.document.body);
		}

		public template = (id, data) => {
			this.templateData[id] = data;
			for (var i = this.templates.length - 1; i >= 0; i--) {
				if(this.templates[i].id == id){
					this.templates[i].data = data;
					break;
				}
			}
		}

		public reloadTemplate = (id) => {
			for (var i = this.templates.length - 1; i >= 0; i--) {
				if(this.templates[i].id == id){
					this.templates[i].render();
					break;
				}
			}
		}

		private scanFromRoot(element: any){
			let blockElements = this.scanBlockElements(element);
			this.templates = this.templates.concat(this.loadTemplateElements(blockElements));
		}

		private scanBlockElements(rootElement: any){
			return rootElement.getElementsByTagName('block');
		}

		private loadTemplateElements(blocks: NodeListOf<Element>){
			let templates:Template[] = [];

			for(let i = 0; i < blocks.length; i++){
				let template = new Template();
				let name = blocks[i].getAttribute('name');
				let id = blocks[i].getAttribute('id') || name;
				let templateHtml = Library.Filer.Current().getFile(name + ".html");
				let data = this.templateData[id];

				templateHtml = this.resolveTemplate(templateHtml, data)
				let elTemplateSubstituteNode = document.createElement("div");
				elTemplateSubstituteNode.innerHTML = templateHtml;

				template.id = id;
				template.blockName = name;
				template.data = data;
				template.block = blocks[i];
				template.template = elTemplateSubstituteNode.firstChild;
				templates.push(template);
				template.render();

				this.scanFromRoot(elTemplateSubstituteNode.firstChild);
			}

			return templates;
		}

		private resolveTemplate(templateHtml, data){
			let scope = new Scope(data);
			scope.makeGlobal();
			let resolvedHtml = eval(templateHtml)
			scope.makeLocal();
			return resolvedHtml;
		}
	}

	class Scope{
		private data: any;

		public constructor(data){
			this.data = data;
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