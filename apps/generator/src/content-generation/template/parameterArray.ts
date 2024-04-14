import { ProjectionSample } from "../projection/parse";
import TemplateArgument from "./argument";
import TemplateParameter from "./parameter";
import TemplateParameterWithSubProjections from "./parameterWithSubProjections";

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

  removeUnusedParameters(projectionSamples: ProjectionSample[]) {
    let paramsWithSubProjections = this.getParamsWithSubProjections();
    const subProjectionGroups = projectionSamples[0].subProjectionGroups;
    if (subProjectionGroups.length === 0) {
      this.removeParamsWithSubProjections();
      return this;
    }
    this.removeParamsBelowOthers();
    paramsWithSubProjections = this.getParamsWithSubProjections();
    if (paramsWithSubProjections.length !== subProjectionGroups.length) {
      throw Error("Provided subprojections do not fit code");
    }
    return this;
  }

  removeParamsWithSubProjections() {
    this.filterInPlace((param) => !(param instanceof TemplateParameterWithSubProjections));
    return this;
  }

  removeParamsBelowOthers() {
    const paramsWithSubProjections = this.getParamsWithSubProjections();
    paramsWithSubProjections.forEach((templateParam) => {
      this.filterInPlace(
        (parameter) =>
          !(
            isPrefixOf(templateParam.path, parameter.path) &&
            parameter.path.length > templateParam.path.length
          )
      );
    });
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

  getParamsWithSubProjections(): Array<TemplateParameterWithSubProjections> {
    return this.filter((parameter) => parameter instanceof TemplateParameterWithSubProjections);
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
