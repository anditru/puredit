import TemplateArgument from "./argument";
import TemplateParameter from "./parameter";

export default class TemplateParameterArray extends Array<TemplateParameter> {
  sortByAppearance() {
    this.sort((parameterA: TemplateParameter, parameterB: TemplateParameter) => {
      const a = parameterA.path;
      const b = parameterB.path;
      const minLength = Math.min(a.length, b.length);
      for (let i = 0; i <= minLength; i++) {
        if (a[i] === undefined && b[i] !== undefined) {
          return -1;
        } else if (a[i] !== undefined && b[i] === undefined) {
          return 1;
        } else if (a[i] === undefined && b[i] === undefined) {
          return 0;
        }

        if (a[i] < b[i]) {
          return -1;
        } else if (a[i] > b[i]) {
          return 1;
        }
      }
    });
  }

  getTemplateArguments(): TemplateArgument[] {
    return this.filter((parameter) => parameter instanceof TemplateArgument);
  }
}
