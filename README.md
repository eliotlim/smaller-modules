# smaller-modules
Shrink node_modules for deployment

# Usage
## Create node_modules for Lambda
```bash
smaller-modules --zip --file dist/handler.js
```
which behaves the same way as (long-hand):
```bash
smaller-modules --zip --file dist/index.js --output-subdirectory nodejs --output-path node_modules.zip
```
