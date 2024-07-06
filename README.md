## Project Overview

This repository extends the projectional code editor [Puredit](https://github.com/niklaskorz/puredit) by [Niklas Korz](https://2023.splashcon.org/profile/niklaskorz) and [Artur Andrzejak](https://aip.ifi.uni-heidelberg.de/team/aa). The editor matches parametrized patterns against a GPL program and displays the matched parts as dynamically rendered widgets.

## Project structure

- `apps/`: executable applications and demos
  - `example/`: an example of a projectional data manipulation DSL based on the TypeScript programming language
  - `generator/`: an application for generating code pattern templates and projection components from samples
  - `parser-playground/`: an experimentation playground used for debugging our pattern matching algorithm
  - `python-dsl/`: an example of a projectional data manipulation DSL based on the Python programming language
- `packages/`: reusable packages that together are used to create a projectional editor
  - `codemirror-typescript/`: a client-side language server for the TypeScript programming language integrated into [CodeMirror 6](https://codemirror.net/), based on [prisma/text-editors](https://github.com/prisma/text-editors)
  - `declarative-projections/`: a library to parse simple textual projections defined as JSON code
  - `language-config/`: a shared package that contains programming language-specific configurations required during the pattern matching process
  - `parser/`: a library for defining syntax tree patterns through code templates and finding nodes matching these patterns in a program's syntax tree
  - `projection-libs/`: contains multiple packages of reusable projections
  - `projection-parser/`: a lezer parser to process projection samples required by the `generator` app
  - `projections/`: an extension for the [CodeMirror 6](https://codemirror.net/) editor for detecting syntax tree patterns in a document and replacing them with interactive projection widgets implemented as Svelte components
  - `tsconfig/`: a common basis configuration for the TypeScript compiler
  - `utils-browser/`: common utility functions for code running in the browser or VS Code webview
  - `utils-node/`: common utility functions for code running in Node.js
  - `utils-shared/`: common utility functions for both environments
- `vscode-extension/`: a Visual Studio Code extension to run the projectional editor
  - `editors/`: the custom editors the extension integrates in VS Code
  - `extension/`: the implementation of the actual VS Code extension as described in the documentation of the [VS Code Extension API](https://code.visualstudio.com/api)
  - `packages/`: reusable packages that together are used to create projectional editors for VS Code
    - `editor-utils/`: Utility functions to create projectional editors for VS Code
    - `webview-interface/`: Type definitions for for messages exchanged between the projectional editors and the VS Code extension.

## Installation and development

Install the dependencies using `npm install`.

### Visual Studio Code Extension

To debug the Visual Studio Code extension execute the following steps:

- Clone the repository.
- Open the cloned repository folder in Visual Studio Code.
- Select the "Run and Debug" view on the left.
- Select the debug configuration "Run Extension" and click the play button.
- Wait until the editor build is completed and an additional Visual Studio Code window opens. <br> NOTE: The extension will **only** be available in this window!
- In the additional Visual Studio Code window open a folder of your choice. e.g. `vscode-extension/test-project`.
- Right-click a `.py` file and select "Open with".
- Select the "Projectional Python Editor" from the list.
