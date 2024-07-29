## Project Overview

This repository extends the projectional code editor [Puredit](https://github.com/niklaskorz/puredit) by [Niklas Korz](https://2023.splashcon.org/profile/niklaskorz) and [Artur Andrzejak](https://aip.ifi.uni-heidelberg.de/team/aa). The editor matches parametrized patterns against a GPL program and displays the matched parts as dynamically rendered widgets.

Detailed documentation of the project can be found in [our wiki](https://github.com/andretrump/puredit/wiki).

## Installing the Visual Studio Code Extension

The preferred way to use the projectional editor is through our VS Code extension. To install and test the extension, proceed as follows:

- Go to the [latest release](https://github.com/andretrump/puredit/releases/latest) and download the asset `test-project.zip`.
- Unpack the zip archive and open the unpacked folder in VS Code.
- In the file explorer, right-click the `.vsix` file and select "Install Extension VSIX" from the context menu.
- If you already had installed an older version of the extension, reload the VS Code window.
- Right-click one of the `.py` files in the folder and select "Open with"
- Select the "Projectional Python Editor" from the list.

The selected file should then open in the projectional editor. You can customize the projectional editor with your own projections as described in the section [YAML- or JSON-based Projections](https://github.com/andretrump/puredit/wiki/Defining-Projections#yaml--or-json-based-projections) of the documentation.

## Testing the Projectional Editor in the Browser

To test the editor without any installation, please refer to [puredit.atrump.de](https://puredit.atrump.de/). There, we host an editor for TypeScript and Python with two test files to try out the projectional editing.

> **NOTE:** Some features of the editor are **only** available in VS Code, e.g. customizing the editor your own projections.

## Development

For instructions on developing projections and the editor itself, please refer to [our wiki](https://github.com/andretrump/puredit/wiki), especially the sections "For DSL Developers" and "For Framework Developers".
