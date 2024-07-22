# @puredit/projections

This package contains all functionality required to render projections in the codemirror editor and to provide extended code completion for the projections.

## `completions`

Here we implement the code completion for the projections.

## `controls`

This folder contains the controls `Keyword` and `TextInput` used in projection widgets.

## `state`

Here we implement everything required to store and update the state of the projections in the codemirror editor. To hold the current state of the projections, we use a [`StateField`](https://codemirror.net/docs/ref/#state.StateField). Updates of the `StateField`(https://codemirror.net/docs/ref/#state.StateField) are triggered by [`UpdateListeners`](https://codemirror.net/docs/ref/#view.EditorView^updateListener) reacting to scrolling as well as changes to the document or cursor movements.

## `widget`

This folder contains the implementation of the widgets we display in the projectional editor.
