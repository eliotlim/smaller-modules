#!/usr/bin/env node

import {Command} from "commander";
import fsExtra from "fs-extra";
import path from "path";
import {
  DEFAULT_OUTPUT_DIRECTORY,
  DEFAULT_OUTPUT_FILENAME,
  DEFAULT_OUTPUT_SUBDIRECTORY,
  SmallerModules
} from "./index.js";

function collect(value: string, previous: string[]) {
  return previous.concat([value]);
}

const program = new Command();
program
  .version("0.3.0-alpha.0")
  .description("Shrink node_modules for deployment")
  .option("-c, --copy", "copy required files to a new directory")
  .option("-l, --list", "output list of required files")
  .option("-z, --zip", "output a zip file containing node_modules")

  .option("-b, --base <path/to/base>", "base directory containing all source files")
  .option("-d, --directory <path/to/js>", "input directory for dependency tracing", collect, [])
  .option("-f, --file <filename.js>", "input file for dependency tracing", collect, [])
  .option("-o, --output-path <path/to/build/output>", "output file (list) or directory (copy / zip)")
  .option("-s, --output-subdirectory <path/to/node_modules>", "sets the path to node_modules relative to the build directory")

program.parse();

const opts = program.opts();

/**
 * Print help if no options were provided
 */
if (!opts.copy && !opts.list && !opts.zip) {
  program.outputHelp();
}

const smaller = new SmallerModules({
  base: opts.base
});

if (opts.directory && opts.directory.length > 0) {
  smaller.directories(opts.directory);
}

if (opts.file && opts.file.length > 0) {
  smaller.files(opts.file);
}

await smaller.trace();

if (opts.list) {
  if (!opts.outputPath && !opts.outputSubdirectory) {
    smaller.list().forEach(entry => console.log(entry));
  } else if (opts.outputPath) {
    fsExtra.writeFileSync(path.join(opts.outputPath), smaller.list().join("\n"));
  }
}

if (opts.copy) {
  await smaller.copy(opts.outputSubdirectory ?? DEFAULT_OUTPUT_DIRECTORY);
}

if (opts.zip) {
  await smaller.zip(opts.outputPath ?? DEFAULT_OUTPUT_FILENAME, {outputSubdirectory: opts.outputSubdirectory ?? DEFAULT_OUTPUT_SUBDIRECTORY});
}
