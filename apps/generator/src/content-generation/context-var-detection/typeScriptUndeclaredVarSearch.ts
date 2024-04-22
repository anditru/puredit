import AstNode from "@puredit/parser/ast/node";
import UndeclaredVarSearch from "./undeclaredVarSearch";

export default class PythonUndeclaredVarSearch extends UndeclaredVarSearch {
  protected readonly NON_VARIABLE_CONDITIONS = [
    { parentType: "function_declaration", fieldName: "name" },
    { parentType: "method_definition", fieldName: "name" },
    { parentType: "member_expression", fieldName: "property" },
  ];

  protected readonly DECLARATION_CONTINUING_CONDITIONS = [
    { parentType: "shorthand_property_identifier_pattern", fieldName: undefined },
    { parentType: "rest_pattern", fieldName: undefined },
    { parentType: "parenthesized_expression", fieldName: undefined },
  ];

  protected readonly DECLARATION_TERMINATING_CONDITIONS = [
    // Identifier
    { parentType: "variable_declarator", fieldName: "value" },
    { parentType: "for_in_statement", fieldName: "right" },
    { parentType: "member_expression", fieldName: "object" },
    { parentType: "pair", fieldName: "value" },
    { parentType: "subscript_expression", fieldName: "object" },
    { parentType: "subscript_expression", fieldName: "index" },
    { parentType: "member_expression", fieldName: "object" },

    { parentType: "if_statement", fieldName: "condition" },
    { parentType: "while_statement", fieldName: "condition" },
    { parentType: "do_statement", fieldName: "condition" },
    { parentType: "switch_statement", fieldName: "value" },
    { parentType: "switch_case", fieldName: "value" },
    { parentType: "return_statement", fieldName: undefined },

    { parentType: "binary_expression", fieldName: "left" },
    { parentType: "binary_expression", fieldName: "right" },
    { parentType: "unary_expression", fieldName: "argument" },
    { parentType: "augmented_assignment_expression", fieldName: "left" },
    { parentType: "augmented_assignment_expression", fieldName: "right" },
    { parentType: "update_expression", fieldName: "argument" },

    // Property identifier
    { parentType: "member_expression", fieldName: "property" },
    { parentType: "pair", fieldName: "key" },
    { parentType: "pair_pattern", fieldName: "key" },
  ];

  protected readonly DECLARATION_INDUCING_CONDITIONS = [
    // Identifier
    { parentType: "variable_declarator", fieldName: "name" },
    { parentType: "for_in_statement", fieldName: "left" },
    { parentType: "required_parameter", fieldName: "pattern" },
    { parentType: "optional_parameter", fieldName: "pattern" },
    { parentType: "pair_pattern", fieldName: "value" },
    { parentType: "array_pattern", fieldName: undefined },
    { parentType: "catch_clause", fieldName: "parameter" },

    // Property identifier
    { parentType: "public_field_definition", fieldName: "name" },
  ];

  protected readonly IDENTIFIER_NODE_TYPES = ["identifier", "property_identifier"];
  protected readonly BLOCK_NODE_TYPE = "statement_block";
  protected readonly MODULE_NODE_TYPE = "program";

  constructor(startNode: AstNode) {
    super(startNode);
  }
}
