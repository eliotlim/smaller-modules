import {SmallerModules} from "../src/index";
import fsExtra from "fs-extra";
import path from "path";

describe('testing SmallerModules class', () => {
  describe('create list of dependencies from source files', () => {
    let smaller: SmallerModules;
    beforeAll(() => {
      smaller = new SmallerModules({});
    });
    test('adding dependencies by filename', () => {
      smaller
        .files(['dist/index.js'])
        .files(['dist/cli.js']);
    });
    test('dependencies should be empty before tracing', () => {
      expect(smaller.list()).toStrictEqual([]);
    });
    test('files should be dependent on themselves', async () => {
      await smaller.trace();
      expect(smaller.list()).toContain("dist/index.js");
      expect(smaller.list()).toContain("dist/cli.js");
    });
  });

  describe('create list of dependencies from directory', () => {
    let smaller: SmallerModules;
    beforeAll(() => {
      smaller = new SmallerModules({});
    });
    test('adding dependencies by directory', () => {
      smaller
        .directories(['dist/']);
    });
    test('dependencies should be empty before tracing', () => {
      expect(smaller.list()).toStrictEqual([]);
    });
    test('expected files should be present', async () => {
      await smaller.trace();
      expect(smaller.list()).toContain("dist/index.js");
      expect(smaller.list()).toContain("dist/cli.js");
    });
  });

  describe('test base path with complex mono-repo setup', () => {
    let smaller: SmallerModules;
    let initialCwd: string;
    let temporaryPackage = path.join("packages", "temporary");
    beforeAll(() => {
      fsExtra.copySync("dist", path.join(temporaryPackage, "dist"));
      initialCwd = process.cwd();
      process.chdir(temporaryPackage);
      smaller = new SmallerModules({
        base: "../..",
      });
    });
    afterAll(() => {
      process.chdir(initialCwd);
      fsExtra.rm(temporaryPackage, {recursive: true, force: true});
    });
    test('adding dependencies by directory', () => {
      smaller
        .directories(['dist/']);
    });
    test('dependencies should be empty before tracing', () => {
      expect(smaller.list()).toStrictEqual([]);
    });
    test('expected files should be present', async () => {
      await smaller.trace();
      expect(smaller.list()).toContain(path.join(temporaryPackage, "dist/index.js"));
      expect(smaller.list()).toContain(path.join(temporaryPackage, "dist/cli.js"));
    });
  });
});
