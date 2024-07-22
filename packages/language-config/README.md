# @puredit/language-config

This package implements the central language configuration to store language-specific properties that are required throughout the project. The actual configuration object is located in `languageConfig.ts`. The object is essentially a map where the keys are language names and the values are objects containing the configurations for the respective language. In the following, we go through the properties of the configuration for each language.

## `lookAheadPaths`

In the [pattern matching algorithm](https://github.com/andretrump/puredit/blob/main/packages/parser/match/patternMatching.ts), we implemented an optimization that performs lookaheads to reduce the number of candidate patterns for pattern matching. Under this property, we store a mapping between node types and tree paths. If a pattern's root node has one of the types mentioned here, we perform a lookahead at the corresponding path.

## `nodeTypesToSplit`

To reduce the number of nodes to be rematched, we implement [lazy matching](https://github.com/andretrump/puredit/blob/main/packages/projections/state/lazyMatching.ts). The first step of lazy matching is to split the syntax tree of a file up into matching units, i.e. nodes that are rematched as a unit. This property controls, which node types are split up during this process. The keys of this configuration are the node types that are split up, i.e. the nodes of these types do not appear as matching units but only their child nodes. The value is either a field name, in case we only want to keep the child nodes under a certain field name, or an asterisk `*` if we want to keep all child nodes.

## `arguments`

Under this property, we stored all configurations related to template arguments which is currently only the `draftTypeMapping`. This is required when the user selects a projection from the code completion. The editor generates code, that matches the pattern but with placeholders for each argument. In the `draftTypeMapping`, we assign each node type the corresponding placeholder. `default` the placeholder that is used for all other node types where no special placeholder is defined. Note that `<type>` will be replaced by the actual node type.

## `aggregations`

Here we store all configurations related to aggregations which is currently only the map of `aggregatableNodeTypes`. Each key is the name of a node type, DSL developers can define aggregations for (e.g. `argument_list`). For each of these node types, we store:

- `startToken`: First token of a node of the respective type
- `endToken`: Last token of a node of the respective type
- `delimiterToken`: Token that separates aggregation parts
- `contextTemplate`: Code sample to insert aggregation parts such that they can be parsed in the correct context.
- `hasStartPattern`: Boolean indicates if the node type requires a special start pattern such as `slice`.

## `chains`

Here we store all configurations related to chains of function calls.

`pathToFirstLink` is the path that least from the root node of a statement like `a.my_func()` to the node representing the first link in the chain.

`chainableNodeTypes` contains a map with all node types that can be part of a chain. For each node type, we store:

- `pathToLinkBegin`: Holds the path from the root of a chain link to the node representing the actual function or attribute name.
- `pathToNextLink`: Holds the path from the root of a chain link to the root of the next link in the chain.

## `blocks`

For code blocks, we store two properties:

- `blockNodeType`: The node type representing a code block in the respective language
- `draft`: The placeholder inserted for a block when the user selects a projection from the code completion that contains a block.

## `comments`

These configurations are required for the extraction of context from comments.

- `statementNodeType`: The node type representing a statement in the respective language.
- `commentTypes`: A map of all comment node types we support to extract comment context from. The property `startTokenRegexes` holds a list of regexes matching the start of a comment of the respective type.
