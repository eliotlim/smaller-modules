#!/usr/bin/env node

import {Command} from "commander";
import {nodeFileTrace} from "@vercel/nft";
import * as fsExtra from "fs-extra";
import path from "path";
import randomWords from "random-words";
import zipLib from "zip-lib";
import {
  copyAllDependencies,
  DEFAULT_OUTPUT_DIRECTORY,
  DEFAULT_OUTPUT_FILENAME,
  DEFAULT_OUTPUT_SUBDIRECTORY,
  DEFAULT_TEMPORARY_DIRECTORY, discoverAllJsFiles
} from "./index.js";

function collect(value: string, previous: string[]) {
  return previous.concat([value]);
}

const program = new Command();
program
  .version("0.1.0")
  .description("Shrink node_modules for deployment")
  .option("-c, --copy", "copy required files to a new directory")
  .option("-l, --list", "output list of required files")
  .option("-z, --zip", "output a zip file containing node_modules")

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

let listOfJSFiles: string[] = [];

if (opts.directory && opts.directory.length > 0) {
  listOfJSFiles = listOfJSFiles.concat(opts.directory.flatMap((directory: string) => discoverAllJsFiles(directory)));
}

if (opts.file && opts.file.length > 0) {
  listOfJSFiles = listOfJSFiles.concat(opts.file);
}

const nftResult = await nodeFileTrace(listOfJSFiles, {});
const listOfDependencies = Array.from(nftResult.fileList);

if (opts.list) {
  if (!opts.outputPath && !opts.outputSubdirectory) {
    listOfDependencies.forEach(entry => console.log(entry));
  } else if (opts.outputPath) {
    fsExtra.writeFileSync(path.join(opts.outputPath), listOfDependencies.join("\n"));
  }
}

if (opts.copy) {
  const targetDirectory = opts.outputSubdirectory ?? DEFAULT_OUTPUT_DIRECTORY;
  await copyAllDependencies(targetDirectory, Array.from(nftResult.fileList));
}

if (opts.zip) {
  const tmpDirectory = `${DEFAULT_TEMPORARY_DIRECTORY}/smaller-modules-${randomWords(2).join('-')}`;
  const targetDirectory = `${tmpDirectory}/${opts.outputSubdirectory ?? DEFAULT_OUTPUT_SUBDIRECTORY}`;
  await copyAllDependencies(targetDirectory, Array.from(nftResult.fileList));
  await zipLib.archiveFolder(tmpDirectory, opts.outputPath ?? DEFAULT_OUTPUT_FILENAME, {followSymlinks: true});
  fsExtra.emptyDirSync(tmpDirectory);
}
