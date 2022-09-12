import klawSync from "klaw-sync";
import * as fsExtra from "fs-extra";
import * as path from "path";
import * as fs from "fs";
import {nodeFileTrace} from "@vercel/nft";
import randomWords from "random-words";
import zipLib from "zip-lib";

export let DEFAULT_OUTPUT_DIRECTORY = './output';
export let DEFAULT_TEMPORARY_DIRECTORY = '/tmp/';
export let DEFAULT_OUTPUT_FILENAME = 'node_modules.zip';
export let DEFAULT_OUTPUT_SUBDIRECTORY = 'nodejs';

export interface SmallerModulesOptions {

}

export class SmallerModules {
  constructor(opts?: SmallerModulesOptions) {
    this.tmpDirectory = `${DEFAULT_TEMPORARY_DIRECTORY}/smaller-modules-${randomWords(2).join('-')}`;
    this.sources = [];
    this.dependencies = [];
  }

  files(files: string[]) {
    this.sources = this.sources.concat(files);
    return this;
  }

  directories(directories: string[]) {
    this.sources = this.sources.concat(directories.flatMap((directory) => discoverAllJsFiles(directory)));
  }

  async trace() {
    this.dependencies = await traceAllJsFiles(this.sources);
    return this;
  }

  list() {
    return this.dependencies;
  }

  async copy(directory: string) {
    await copyAllFiles(this.tmpDirectory, this.dependencies);
    await fsExtra.move(this.tmpDirectory, directory);
    return this;
  }

  async zip(filename: string, opts?: {outputSubdirectory?: string}) {
    const targetDirectory = `${this.tmpDirectory}/${opts?.outputSubdirectory ?? DEFAULT_OUTPUT_SUBDIRECTORY}`;
    await copyAllFiles(targetDirectory, this.dependencies);
    await zipLib.archiveFolder(this.tmpDirectory, path.normalize(filename), {followSymlinks: true});
    return this;
  }

  cleanup() {
    fsExtra.emptyDirSync(this.tmpDirectory);
    this.sources = [];
    this.dependencies = [];
  }

  private tmpDirectory: string;
  private sources: string[];
  private dependencies: string[];
}

export function discoverAllJsFiles(directory: string): string[] {
  return klawSync(directory, {
    traverseAll: true,
    filter: (item) => item.stats.isFile() && item.path.endsWith(".js")
  }).map(item => item.path);
}

export async function traceAllJsFiles(files: string[]) {
  const nftResult = await nodeFileTrace(files, {});
  return Array.from(nftResult.fileList);
}

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
