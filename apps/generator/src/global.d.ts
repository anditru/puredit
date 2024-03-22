import { Question as InquirerQuestion } from "inquirer";

declare module "inquirer" {
  interface Question extends InquirerQuestion {
    choices?: any[];
  }
}

declare global {
  interface Array<T> {
    findLastIndex(predicate: (value: T, index: number, obj: T[]) => unknown, thisArg?: any): number;
  }
}
