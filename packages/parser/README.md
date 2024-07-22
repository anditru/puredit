# @puredit/parser

This package contains the functionality to define, parse, and match syntax tree patterns.

## `ast`

Contains classes to represent and operate on syntax trees produced by Tree-sitter.

## `cursor`

Contains an abstract implementation of a transaction-enabled cursor. It is the base class of our `AstCursor` and `PatternCursor`.

## `match`

Contains the implementation of the pattern-matching algorithms.

## `parse`

Contains the implementation to parse templates into patterns.

## `pattern`

Contains the classes to represent and operate on syntax tree patterns.

## `template`

Contains the classes to represent templates.

## `tree-sitter`

Contains utils to initilaize the Tree-sitter parsers.

## `wasm`

Contains the `.wasm` resources required for the Tree-sitter parsers.
