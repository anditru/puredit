export default class TemplatePartArray extends Array<string> {
  public readonly raw: string[];
  constructor(...elements: string[]) {
    super(...elements);
    this.raw = elements;
  }
}
