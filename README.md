# smaller-modules

Shrink node_modules for deployment

# Introduction

![An illustration of the heaviest objects in the universe](https://i.redd.it/tfugj4n3l6ez.png "node_modules")

Are you having problems getting `node_modules` down to a reasonable size?

```text
Unzipped size must be smaller than 262144000 bytes
```

# Quickstart

## Zip up `node_modules` for Lambda

```bash
smaller-modules --zip --file dist/handler.js
```

## Copy dependencies of compiled output to a new directory

```bash
smaller-modules --copy --directory dist --output-subdirectory smaller_modules
```

## List dependencies of a `.js` file

```bash
smaller-modules --list --file dist/index.js --output-path dependencies.txt
```

## or print it to the command line

```bash
smaller-modules --list --file dist/index.js
```

# Usage

## Zip up `node_modules` for Lambda (in long-hand)

```bash
smaller-modules --zip --file dist/index.js --output-subdirectory nodejs --output-path node_modules.zip
```
