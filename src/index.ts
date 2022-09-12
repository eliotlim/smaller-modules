import klawSync from "klaw-sync";
import * as fsExtra from "fs-extra";
import * as path from "path";
import * as fs from "fs";

export let DEFAULT_OUTPUT_DIRECTORY = './output';
export let DEFAULT_TEMPORARY_DIRECTORY = '/tmp/';
export let DEFAULT_OUTPUT_FILENAME = 'node_modules.zip';
export let DEFAULT_OUTPUT_SUBDIRECTORY = 'nodejs';

export function discoverAllJsFiles(directory: string): string[] {
  return klawSync(directory, {
    traverseAll: true,
    filter: (item) => item.stats.isFile() && item.path.endsWith(".js")
  }).map(item => item.path);
}

export async function copyAllDependencies(targetDirectory: string, dependencies: string[]) {
  return Promise.all(dependencies.map((dependency) => {
    const dstPath = path.join(targetDirectory, dependency);
    return new Promise(async (resolve, reject) => {
      await fsExtra.ensureDir(path.dirname(dstPath));
      await fs.copyFile(dependency, dstPath, err => reject(err));
      resolve(dstPath);
    });
  }));
}
