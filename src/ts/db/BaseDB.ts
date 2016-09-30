/// <reference path="../_references.ts" />

module DB{
	export class BaseModel{
		public constructor(id){
			this.id = id;
		}

		public id: number;
	}

	export class BaseDB<TModel extends BaseModel>{
		private file: string;

		public constructor(file: string){
			this.file = file;
		}

		public all (): linq.Enumerable<any> {
			let movies: any[] = Library.Filer.Current().getFile(this.file);
			return Enumerable.From(movies);
		}

		public getPopularContent (): any {
			let content: any = Library.Filer.Current().getFile("json/popular-content.json");
			return content;
		}
	}
}