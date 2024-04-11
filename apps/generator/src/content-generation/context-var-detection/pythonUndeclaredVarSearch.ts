import AstNode from "@puredit/parser/ast/node";
import UndeclaredVarSearch from "./undeclaredVarSearch";

export default class PythonUndeclaredVarSearch extends UndeclaredVarSearch {
  protected readonly NON_VARIABLE_CONDITIONS = [
    { parentType: "class_definition", fieldName: "name" },
    { parentType: "function_definition", fieldName: "name" },
    { parentType: "call", fieldName: "function" },
    { parentType: "attribute", fieldName: "attribute" },
  ];

  protected readonly DECLARATION_CONTINUING_CONDITIONS = [
    { parentType: "list_pattern", fieldName: undefined },
    { parentType: "tuple_pattern", fieldName: undefined },
    { parentType: "list_splat_pattern", fieldName: undefined },
    { parentType: "parenthesized_expression", fieldName: undefined },
  ];

  protected readonly DECLARATION_TERMINATING_CONDITIONS = [
    { parentType: "expression_statement", fieldName: undefined },
    { parentType: "assignment", fieldName: "right" },
    { parentType: "augmented_assignment", fieldName: "right" },
    { parentType: "augmented_assignment", fieldName: "left" },
    { parentType: "attribute", fieldName: "object" },
    { parentType: "attribute", fieldName: "attribute" },
    { parentType: "subscript", fieldName: "value" },
    { parentType: "subscript", fieldName: "subscript" },
    { parentType: "slice", fieldName: undefined },
    { parentType: "list", fieldName: undefined },
    { parentType: "tuple", fieldName: undefined },
    { parentType: "argument_list", fieldName: undefined },
    { parentType: "keyword_argument", fieldName: "name" },
    { parentType: "keyword_argument", fieldName: "value" },
    { parentType: "default_parameter", fieldName: "value" },
    { parentType: "interpolation", fieldName: "expression" },

    { parentType: "if_statement", fieldName: "condition" },
    { parentType: "elif_clause", fieldName: "condition" },
    { parentType: "while_statement", fieldName: "condition" },
    { parentType: "assert_statement", fieldName: undefined },
    { parentType: "return_statement", fieldName: undefined },

    { parentType: "binary_operator", fieldName: "left" },
    { parentType: "binary_operator", fieldName: "right" },
    { parentType: "unary_operator", fieldName: "argument" },
    { parentType: "not_operator", fieldName: "argument" },
    { parentType: "boolean_operator", fieldName: "left" },
    { parentType: "boolean_operator", fieldName: "right" },
    { parentType: "comparison_operator", fieldName: "left" },
    { parentType: "comparison_operator", fieldName: "right" },
  ];

  protected readonly DECLARATION_INDUCING_CONDITIONS = [
    { parentType: "assignment", fieldName: "left" },
    { parentType: "for_statement", fieldName: "left" },
    { parentType: "as_pattern_target", fieldName: undefined },
    { parentType: "parameters", fieldName: undefined },
    { parentType: "default_parameter", fieldName: "name" },
  ];

  protected readonly IDENTIFIER_NODE_TYPES = ["identifier"];
  protected readonly BLOCK_NODE_TYPE = "block";
  protected readonly MODULE_NODE_TYPE = "module";

  constructor(startNode: AstNode) {
    super(startNode);
  }
}
