import {SmallerModules} from "../src/index";

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
});
