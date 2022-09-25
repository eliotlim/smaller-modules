import klawSync from "klaw-sync";
import * as fs from "fs";
import fsExtra from "fs-extra";
import * as path from "path";
import {nodeFileTrace} from "@vercel/nft";
import randomWords from "random-words";
import zipLib from "zip-lib";

export let DEFAULT_OUTPUT_DIRECTORY = './output';
export let DEFAULT_TEMPORARY_DIRECTORY = '/tmp';
export let DEFAULT_OUTPUT_FILENAME = 'node_modules.zip';
export let DEFAULT_OUTPUT_SUBDIRECTORY = 'nodejs';

/**
 * Options structure for SmallerModules class
 */
export interface SmallerModulesOptions {
  /**
   * List of javascript source files to analyse for dependencies
   *
   * Example: `["dist/index.js", "dist/cli.js"]`
   */
  sources?: string[],
  /**
   * List of dependency files to be included in the output
   *
   * Example: `["package.json", "LICENSE"]`
   */
  dependencies?: string[];
}

export interface SmallerModulesZipOptions {
  /**
   * Subdirectory to nest dependencies in within the zip archive
   *
   * Example: `"nodejs"` for lambda layers
   */
  outputSubdirectory?: string
}

/**
 * SmallerModules utility class provides chainable invocations to (try to) improve user ergonomics.
 *
 * Example: `(await new SmallerModules().directory("dist").trace()).list();`
 *
 * Your mileage may vary.
 */
export class SmallerModules {
  /**
   * Allocates a new SmallerModules instance to provide stateful tracing of source file dependencies
   * @param opts options to initialise data structures and override defaults
   */
  constructor(opts?: SmallerModulesOptions) {
    this.tmpDirectory = path.join(DEFAULT_TEMPORARY_DIRECTORY, `smaller-modules-${randomWords(2).join('-')}`);
    this.sources = opts?.sources ?? [];
    this.dependencies = opts?.dependencies ?? [];
  }

  /**
   * Store and analyse these source files for dependencies
   * @param files list of source files (e.g. `["dist/index.js", "dist/cli.js"]`)
   * @return a chainable SmallerModules instance
   */
  files(files: string[]) {
    this.sources = this.sources.concat(files);
    return this;
  }

  /**
   * Traverse these directories and store all discovered source files to analyse for dependencies
   * @param directories list of directories (e.g. `["dist", "bin"]`)
   * @return a chainable SmallerModules instance
   */
  directories(directories: string[]) {
    this.sources = this.sources.concat(directories.flatMap((directory) => discoverAllJsFiles(directory)));
    return this;
  }

  /**
   * Analyse stored and discovered source files for dependencies
   */
  async trace() {
    this.dependencies = this.dependencies.concat(await traceAllJsFiles(this.sources));
    return this;
  }

  /**
   * List dependencies identified through analysis of source files
   * @returns list of dependencies
   */
  list(): string[] {
    return this.dependencies;
  }

  /**
   * Copy identified dependencies to the destination folder
   * @param directory
   */
  async copy(directory: string) {
    try {
      await copyAllFiles(this.tmpDirectory, this.dependencies);
      await fsExtra.move(this.tmpDirectory, path.normalize(directory));
    } finally {
      this.cleanup();
    }
    return this;
  }

  /**
   * Zip identified dependencies in a self-contained archive
   * @param filename name of archive (e.g. `"lambda.zip"`)
   * @param opts optional parameters to configure zip operation
   */
  async zip(filename: string, opts?: SmallerModulesZipOptions) {
    try {
      const targetDirectory = path.join(this.tmpDirectory, opts?.outputSubdirectory ?? DEFAULT_OUTPUT_SUBDIRECTORY);
      await copyAllFiles(targetDirectory, this.dependencies);
      await zipLib.archiveFolder(this.tmpDirectory, path.normalize(filename), {followSymlinks: true});
    } finally {
      this.cleanup();
    }
    return this;
  }

  /**
   * Cleans up the temporary directory (but only if it's the default one)
   */
  cleanup() {
    if (this.tmpDirectory !== "" && path.normalize(this.tmpDirectory).startsWith(`${DEFAULT_TEMPORARY_DIRECTORY}/smaller-modules-`)) {
      fsExtra.removeSync(path.normalize(this.tmpDirectory));
    }
  }

  private tmpDirectory: string;
  private sources: string[];
  private dependencies: string[];
}

/**
 * Discovers all source files in the directory
 * @param directory path to directory containing source files
 */
export function discoverAllJsFiles(directory: string): string[] {
  return klawSync(directory, {
    traverseAll: true,
    filter: (item) => item.stats.isFile() && item.path.endsWith(".js")
  }).map(item => item.path);
}

/**
 * Return a de-duplicated list of dependencies from analysing and tracing source files
 * @param files list of paths to source files
 * @return Promise containing dependencies list of paths to dependency files
 */
export async function traceAllJsFiles(files: string[]): Promise<string[]> {
  const nftResult = await nodeFileTrace(files, {});
  return Array.from(nftResult.fileList);
}

/**
 * Copies all dependency files to the specified directory
 * @param targetDirectory path to destination directory
 * @param dependencies list of dependency files to be copied
 */
export async function copyAllFiles(targetDirectory: string, dependencies: string[]) {
  return Promise.all(dependencies.map((dependency) => {
    const dstPath = path.join(targetDirectory, dependency);
    return new Promise(async (resolve, reject) => {
      await fsExtra.ensureDir(path.dirname(dstPath));
      await fs.copyFile(dependency, dstPath, err => reject(err));
      resolve(dstPath);
    });
  }));
}
