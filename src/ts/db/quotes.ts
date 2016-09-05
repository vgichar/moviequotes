/// <reference path="../_references.ts" />

module DB{
	class Quote{
		public id: number;
		public movieId: number;
		public text: string;
		public likes: number;
	}

	export class QoutesDB{
		public all = () => {
		}

		public take = (offset, take) => {

		}

		public get = (id) => {
			
		}

		public getByMovie = (movieId) => {

		}

		public getQuoteOfTheDay = () => {

		}
	}

	class LocalStorageQuotes{
		public getPreviousQuotesOfTheDay = () => {

		}

		public getCurrentQuoteOfTheDay = () => {

		}

		public setCurrentQuoteOfTheDay = (quote) => {

		}
	}
}