# smaller-modules

Shrink node_modules for deployment

# Usage

## Trace dependencies from folder of compiled output

```bash
smaller-modules --copy --directory dist --output-subdirectory smaller_modules
```

## Create node_modules for Lambda

```bash
smaller-modules --zip --file dist/handler.js
```

which behaves the same way as (long-hand):

```bash
smaller-modules --zip --file dist/index.js --output-subdirectory nodejs --output-path node_modules.zip
```
