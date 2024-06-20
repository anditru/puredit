# Puredit

The **Pur**ist **edit**or is a projectional editor that uses textual code as its source of truth. Unlike other projectional editors, Puredit is based on the assumption that parsers are fast enough to continuously react to changes to a document and update the projections accordingly. Projections are derived from patterns on the abstract syntax tree. To make the definition of patterns easy, they are parsed from actual code snippets in the target language.

## Extension Settings

This extension contributes the following settings:

- `puredit.declarativeProjectionDescriptors`: Enter absolute paths to your .ext.json files containing declaratively defined projections.
- `puredit.enabledPackages`: Enable or disable built-in projection packages.

## Known Issues

- Stability problems.

## Release Notes

### 0.0.1

Alpha release of Puredit
