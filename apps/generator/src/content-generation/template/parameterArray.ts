import TemplateArgument from "./argument";
import TemplateParameter from "./parameter";
import ComplexTemplateParameter from "./complexParameter";

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

  removeUnusedParameters(usedParamsWithSubProjections: ComplexTemplateParameter[]) {
    this.filterInPlace(
      (templateParam) =>
        !(templateParam instanceof ComplexTemplateParameter) ||
        usedParamsWithSubProjections.includes(templateParam)
    );
    usedParamsWithSubProjections.forEach((templateParam) => {
      this.filterInPlace(
        (parameter) =>
          !(
            isPrefixOf(templateParam.path, parameter.path) &&
            parameter.path.length > templateParam.path.length
          )
      );
    });
    return this;
  }

  removeComplexParams() {
    this.filterInPlace((param) => !(param instanceof ComplexTemplateParameter));
    return this;
  }

  filterInPlace(condition: (a: TemplateParameter) => boolean) {
    let i = 0,
      j = 0;
    while (i < this.length) {
      const param = this[i];
      if (condition(param)) this[j++] = param;
      i++;
    }
    this.length = j;
    return this;
  }

  getComplexParams(): Array<ComplexTemplateParameter> {
    return this.filter((parameter) => parameter instanceof ComplexTemplateParameter);
  }

  getTemplateArguments(): TemplateArgument[] {
    return this.filter((parameter) => parameter instanceof TemplateArgument);
  }
}

function isPrefixOf(prefix: number[], target: number[]): boolean {
  if (target.length < prefix.length) {
    return false;
  }
  for (let i = 0; i < prefix.length; i++) {
    if (prefix[i] !== target[i]) {
      return false;
    }
  }
  return true;
}
