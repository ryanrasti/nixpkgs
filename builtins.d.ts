// Nix Builtins Type Declarations
// Reference: https://nix.dev/manual/nix/2.18/language/builtins

// ─── Base Types ──────────────────────────────────────────────────────────────

type Path = string & { readonly __nixPath: unique symbol };

/** A file set for operations like lib.fileset.* */
type FileSet = any;

type HashAlgorithm = "md5" | "sha1" | "sha256" | "sha512";

type NixTypeName =
  | "int"
  | "float"
  | "bool"
  | "string"
  | "path"
  | "null"
  | "set"
  | "list"
  | "lambda"
  | "function";

type NixValue =
  | number
  | string
  | boolean
  | Path
  | any[]
  | { [key: string]: any }
  | ((...args: any[]) => any);

type FileType = "regular" | "directory" | "symlink" | "unknown";

interface StringContext {
  path?: boolean;
  allOutputs?: boolean;
  outputs?: string[];
}

interface SourcePos {
  file: string;
  line: number;
  column: number;
}

// ─── Derivation ──────────────────────────────────────────────────────────────

interface DerivationArgs {
  name?: string;
  system?: string;
  builder?: string | Path;
  args?: string[];
  outputs?: string[];
  __structuredAttrs?: boolean;
  __contentAddressed?: boolean;
  allowedReferences?: string[];
  allowedRequisites?: string[];
  disallowedReferences?: string[];
  disallowedRequisites?: string[];
  exportReferencesGraph?: any[];
  impureEnvVars?: string[];
  outputHash?: string;
  outputHashAlgo?: string;
  outputHashMode?: "flat" | "recursive";
  passAsFile?: string[];
  preferLocalBuild?: boolean;
  allowSubstitutes?: boolean;
  [key: string]: NixValue | undefined;
}

interface Derivation {
  type: "derivation";
  name: string;
  system: string;
  outPath: string;
  drvPath: string;
  outputName: string;
  // Common outputs
  out: string;
  dev?: string;
  doc?: string;
  man?: string;
  lib?: string;
}

// ─── Fetcher Arg Types ───────────────────────────────────────────────────────

interface FetchGitArgs {
  url: string;
  ref?: string;
  rev?: string;
  name?: string;
  narHash?: string;
  submodules?: boolean;
  shallow?: boolean;
  allRefs?: boolean;
}

interface FetchGitResult {
  outPath: string;
  rev: string;
  shortRev: string;
  lastModified: number;
  lastModifiedDate: string;
  revCount: number;
  submodules: boolean;
}

interface FetchTarballArgs {
  url: string;
  name?: string;
  sha256?: string;
}

interface FetchMercurialArgs {
  url: string;
  rev?: string;
  name?: string;
}

interface FetchClosureArgs {
  fromStore: string;
  fromPath: string;
  toPath?: string;
  inputAddressed?: boolean;
}

// ─── Builtins ────────────────────────────────────────────────────────────────

interface Builtins {
  // ── Constants ──────────────────────────────────────────────────────────

  /** Reference to the builtins attrset itself. */
  builtins: Builtins;

  /** The current system platform identifier (e.g. `"x86_64-linux"`). */
  currentSystem: string;

  /** The current Unix timestamp at evaluation time. */
  currentTime: number;

  /** The current Nix language version. */
  langVersion: number;

  /** The Nix search path (`NIX_PATH`), represented as a list of `{ prefix, path }` entries. */
  nixPath: Array<{ prefix: string; path: string }>;

  /** The Nix version string (e.g. `"2.18.1"`). */
  nixVersion: string;

  /** The Nix store directory, usually `"/nix/store"`. */
  storeDir: string;

  true: true;
  false: false;
  null: null;

  // ── Derivation ─────────────────────────────────────────────────────────

  /** The fundamental function for creating derivations. Described in its own section of the Nix manual. */
  derivation(attrs: DerivationArgs): Derivation;

  /** Low-level derivation creation primitive. Prefer `derivation`. */
  derivationStrict(attrs: DerivationArgs): Derivation;

  // ── Error / Debug ──────────────────────────────────────────────────────

  /**
   * Abort Nix expression evaluation and print the error message `s`.
   */
  abort(s: string): never;

  /**
   * Throw an error message `s`. This usually aborts Nix expression evaluation,
   * but in `nix-env -qa` and other commands that try to evaluate a set of
   * derivations to get information about those derivations, a derivation that
   * throws an error is silently skipped (which is not the case for `abort`).
   */
  throw(s: string): never;

  /**
   * In debug mode (enabled using `--debugger`), pause Nix expression evaluation
   * and enter the REPL. Otherwise, return the argument `v`.
   */
  break<T>(v: T): T;

  /**
   * Evaluate `e1` and print its abstract syntax representation on standard error.
   * Then return `e2`. This function is useful for debugging.
   */
  trace(msg: any): <T>(v: T) => T;

  /**
   * Evaluate `e1` and print its abstract syntax representation on standard error
   * if `--trace-verbose` is enabled. Then return `e2`. This function is useful for debugging.
   */
  traceVerbose(msg: any): <T>(v: T) => T;

  /**
   * Print a warning message and return the second argument.
   */
  warn(msg: string): <T>(v: T) => T;

  /**
   * This is like `seq e1 e2`, except that `e1` is evaluated *deeply*: if it's a
   * list or set, its elements or attributes are also evaluated recursively.
   */
  deepSeq(e1: any): <T>(e2: T) => T;

  /**
   * Evaluate `e1`, then evaluate and return `e2`. This ensures that a computation
   * is strict in the value of `e1`.
   */
  seq(e1: any): <T>(e2: T) => T;

  /**
   * Try to shallowly evaluate `e`. Return a set containing the attributes `success`
   * (`true` if `e` evaluated successfully, `false` if an error was thrown) and `value`,
   * equalling `e` if successful and `false` otherwise.
   *
   * `tryEval` will only prevent errors created by `throw` or `assert` from being thrown.
   * Errors like `abort` and type errors generated by builtins will not be caught.
   *
   * Note that this doesn't evaluate `e` deeply; using `builtins.deepSeq` can achieve
   * expected results.
   */
  tryEval<T>(e: T): { success: true; value: T } | { success: false; value: false };

  /**
   * Add error context string to a value for better error messages.
   */
  addErrorContext(context: string): <T>(v: T) => T;

  // ── Arithmetic ─────────────────────────────────────────────────────────

  /** Return the sum of the numbers `e1` and `e2`. */
  add(e1: number): (e2: number) => number;

  /** Return the difference between the numbers `e1` and `e2`. */
  sub(e1: number): (e2: number) => number;

  /** Return the product of the numbers `e1` and `e2`. */
  mul(e1: number): (e2: number) => number;

  /** Return the quotient of the numbers `e1` and `e2`. */
  div(e1: number): (e2: number) => number;

  /**
   * Return `true` if the number `e1` is less than the number `e2`, and `false` otherwise.
   * Evaluation aborts if either `e1` or `e2` does not evaluate to a number.
   */
  lessThan(e1: number): (e2: number) => boolean;

  /** Return the bitwise AND of the integers `e1` and `e2`. */
  bitAnd(e1: number): (e2: number) => number;

  /** Return the bitwise OR of the integers `e1` and `e2`. */
  bitOr(e1: number): (e2: number) => number;

  /** Return the bitwise XOR of the integers `e1` and `e2`. */
  bitXor(e1: number): (e2: number) => number;

  /**
   * Converts an IEEE-754 double-precision floating-point number to the next higher integer.
   * If the datatype is neither an integer nor a "float", an evaluation error will be thrown.
   */
  ceil(x: number): number;

  /**
   * Converts an IEEE-754 double-precision floating-point number to the next lower integer.
   * If the datatype is neither an integer nor a "float", an evaluation error will be thrown.
   */
  floor(x: number): number;

  // ── String ─────────────────────────────────────────────────────────────

  /**
   * Concatenate a list of strings with a separator between each element.
   *
   * @example
   * concatStringsSep "/" ["usr" "local" "bin"] == "usr/local/bin"
   */
  concatStringsSep(separator: string): (list: string[]) => string;
  /** Alias — not a real builtin, but some nix code uses it. */
  concatStrings(list: string[]): string;

  /**
   * Given string `s`, replace every occurrence of the strings in `from` with the
   * corresponding string in `to`. The argument `to` is lazy, that is, it is only
   * evaluated when its corresponding pattern in `from` is matched in the string `s`.
   *
   * @example
   * builtins.replaceStrings ["oo" "a"] ["a" "i"] "foobar" == "fabir"
   */
  replaceStrings(from: string[]): (to: string[]) => (s: string) => string;

  /**
   * Return the length of the string `e`.
   * If `e` is not a string, evaluation is aborted.
   */
  stringLength(s: string): number;

  /**
   * Return the substring of `s` from character position `start` (zero-based) up to
   * but not including `start + len`. If `start` is greater than the length of the string,
   * an empty string is returned. If `start + len` lies beyond the end of the string,
   * only the substring up to the end of the string is returned. `start` must be non-negative.
   *
   * @example
   * builtins.substring 0 3 "nixos" == "nix"
   */
  substring(start: number): (len: number) => (s: string) => string;

  /**
   * Convert the expression `e` to a string. `e` can be: a string (returned unmodified),
   * a path (e.g. `toString /foo/bar` yields `"/foo/bar"`), a set containing
   * `{ __toString = self: ...; }` or `{ outPath = ...; }`, an integer, a list
   * (with space-joined string representations of elements), a Boolean (`false` yields `""`,
   * `true` yields `"1"`), or `null` (which yields the empty string).
   */
  toString(e: any): string;

  /**
   * Return a base-16 representation of the cryptographic hash of string `s`.
   * The hash algorithm specified by `type` must be one of `"md5"`, `"sha1"`, `"sha256"` or `"sha512"`.
   */
  hashString(type: HashAlgorithm): (s: string) => string;

  /**
   * Compare two strings representing versions and return `-1` if version `s1` is older
   * than version `s2`, `0` if they are the same, and `1` if `s1` is newer than `s2`.
   * The version comparison algorithm is the same as the one used by `nix-env -u`.
   */
  compareVersions(s1: string): (s2: string) => -1 | 0 | 1;

  /**
   * Split a string representing a version into its components, by the same version
   * splitting logic underlying the version comparison in `nix-env -u`.
   */
  splitVersion(s: string): string[];

  /**
   * Split the string `s` into a package name and version. The package name is everything
   * up to but not including the first dash not followed by a letter, and the version is
   * everything following that dash. The result is returned in a set `{ name, version }`.
   *
   * @example
   * builtins.parseDrvName "nix-0.12pre12876" == { name = "nix"; version = "0.12pre12876"; }
   */
  parseDrvName(s: string): { name: string; version: string };

  /**
   * Return a placeholder string for the specified `output` that will be substituted
   * by the corresponding output path at build time. Typical outputs would be `"out"`,
   * `"bin"` or `"dev"`.
   */
  placeholder(output: string): string;

  /**
   * Returns a list if the extended POSIX regular expression `regex` matches `str` precisely,
   * otherwise returns `null`. Each item in the list is a regex group.
   */
  match(regex: string): (str: string) => any;

  /**
   * Returns a list composed of non-matched strings interleaved with the lists of the
   * extended POSIX regular expression `regex` matches of `str`. Each item in the lists
   * of matched sequences is a regex group.
   */
  split(regex: string): (str: string) => Array<string | string[]>;

  // ── List ───────────────────────────────────────────────────────────────

  /**
   * Return `true` if the function `pred` returns `true` for all elements of `list`,
   * and `false` otherwise.
   */
  all(pred: (elem: any) => boolean): (list: any[]) => boolean;

  /**
   * Return `true` if the function `pred` returns `true` for at least one element
   * of `list`, and `false` otherwise.
   */
  any(pred: (elem: any) => boolean): (list: any[]) => boolean;

  /**
   * Collect each attribute named `attr` from a list of attribute sets. Attrsets
   * that don't contain the named attribute are ignored.
   *
   * @example
   * builtins.catAttrs "a" [{a = 1;} {b = 0;} {a = 2;}] == [1 2]
   */
  catAttrs(attr: string): (list: Array<Record<string, any>>) => any[];

  /** Concatenate a list of lists into a single list. */
  concatLists(lists: any[][]): any[];

  /**
   * This function is equivalent to `builtins.concatLists (map f list)` but is more efficient.
   */
  concatMap(f: (elem: any) => any[]): (list: any[]) => any[];

  /**
   * Return `true` if a value equal to `x` occurs in the list `xs`, and `false` otherwise.
   */
  elem(x: any): (xs: any[]) => boolean;

  /**
   * Return element `n` from the list `xs`. Elements are counted starting from 0.
   * A fatal error occurs if the index is out of bounds.
   */
  elemAt(xs: any[]): (n: number) => any;

  /**
   * Return a list consisting of the elements of `list` for which the function `f`
   * returns `true`.
   */
  filter(f: (elem: any) => unknown): (list: any[]) => any[];

  /**
   * Reduce a list by applying a binary operator, from left to right.
   * `foldl' op nul [x0 x1 x2 ...] = op (op (op nul x0) x1) x2) ...`
   *
   * The return value of each application of `op` is evaluated immediately,
   * even for intermediate values.
   *
   * @example
   * foldl' (x: y: x + y) 0 [1 2 3] == 6
   */
  foldl_(op: (acc: any) => (elem: any) => any, init: any, list: any[]): any;

  /**
   * Generate list of size `length`, with each element `i` equal to the value
   * returned by `generator i`.
   *
   * @example
   * builtins.genList (x: x * x) 5 == [ 0 1 4 9 16 ]
   */
  genList(generator: (i: number) => any): (length: number) => any[];

  /**
   * Groups elements of `list` together by the string returned from the function `f`
   * called on each element. It returns an attribute set where each attribute value
   * contains the elements of `list` that are mapped to the same corresponding
   * attribute name returned by `f`.
   *
   * @example
   * builtins.groupBy (builtins.substring 0 1) ["foo" "bar" "baz"]
   *   == { b = [ "bar" "baz" ]; f = [ "foo" ]; }
   */
  groupBy(f: (elem: any) => string): (list: any[]) => Record<string, any[]>;

  /**
   * Return the first element of a list; abort evaluation if the argument isn't a list
   * or is an empty list. You can test whether a list is empty by comparing it with `[]`.
   */
  head(list: any[]): any;

  /** Return the length of the list `e`. */
  length(list: any[]): number;

  /**
   * Apply the function `f` to each element in the list `list`.
   *
   * @example
   * map (x: "foo" + x) [ "bar" "bla" "abc" ] == [ "foobar" "foobla" "fooabc" ]
   */
  map(f: (elem: any) => any): (list: any[]) => any[];

  /**
   * Given a predicate function `pred`, this function returns an attrset containing
   * a list named `right`, containing the elements in `list` for which `pred` returned
   * `true`, and a list named `wrong`, containing the elements for which it returned `false`.
   *
   * @example
   * builtins.partition (x: x > 10) [1 23 9 3 42]
   *   == { right = [ 23 42 ]; wrong = [ 1 9 3 ]; }
   */
  partition(pred: (elem: any) => boolean): (list: any[]) => { right: any[]; wrong: any[] };

  /**
   * Return `list` in sorted order. It repeatedly calls the function `comparator` with
   * two elements. The comparator should return `true` if the first element is less than
   * the second, and `false` otherwise.
   *
   * This is a stable sort: it preserves the relative order of elements deemed equal
   * by the comparator.
   *
   * @example
   * builtins.sort builtins.lessThan [ 483 249 526 147 42 77 ] == [ 42 77 147 249 483 526 ]
   */
  sort(comparator: (a: any) => (b: any) => boolean): (list: any[]) => any[];

  /**
   * Return the second to last elements of a list; abort evaluation if the argument
   * isn't a list or is an empty list.
   *
   * **Warning:** This function should generally be avoided since it's inefficient:
   * unlike Haskell's `tail`, it takes O(n) time, so recursing over a list by repeatedly
   * calling `tail` takes O(n^2) time.
   */
  tail(list: any[]): any[];

  /**
   * Takes an attrset with `startSet` and `operator` attributes. Starting from `startSet`,
   * repeatedly applies `operator` to each element, collecting results until no new elements
   * (by `key` attribute) are found. Each element must have a `key` attribute used for
   * deduplication.
   */
  genericClosure<T extends { key: NixValue }>(args: {
    startSet: T[];
    operator: (item: T) => T[];
  }): T[];

  // ── Attribute Set ──────────────────────────────────────────────────────

  /**
   * Return the names of the attributes in the set `set` in an alphabetically sorted list.
   *
   * @example
   * builtins.attrNames { y = 1; x = "foo"; } == [ "x" "y" ]
   */
  attrNames(set: Record<string, any>): string[];

  /**
   * Return the values of the attributes in the set `set` in the order corresponding
   * to the sorted attribute names.
   */
  attrValues(set: Record<string, any>): any[];

  /**
   * `getAttr` returns the attribute named `s` from `set`. Evaluation aborts if the
   * attribute doesn't exist. This is a dynamic version of the `.` operator, since
   * `s` is an expression rather than an identifier.
   */
  getAttr(name: string): (set: Record<string, any>) => any;

  /**
   * `hasAttr` returns `true` if `set` has an attribute named `s`, and `false` otherwise.
   * This is a dynamic version of the `?` operator, since `s` is an expression rather
   * than an identifier.
   */
  hasAttr(name: string): (set: Record<string, any>) => boolean;

  /**
   * Return a set consisting of the attributes in the set `e2` which have the same name
   * as some attribute in `e1`. Performs in O(n log m) where n is the size of the smaller
   * set and m the larger set's size.
   */
  intersectAttrs<A, B>(e1: Record<string, A>): (e2: Record<string, B>) => Record<string, B>;

  /**
   * Construct a set from a list specifying the names and values of each attribute. Each
   * element of the list should be a set consisting of a string-valued attribute `name`
   * specifying the name of the attribute, and an attribute `value` specifying its value.
   *
   * In case of duplicate occurrences of the same name, the first takes precedence.
   */
  listToAttrs(list: Array<{ name: string; value: any }>): Record<string, any>;

  /**
   * Apply function `f` to every element of `attrset`. `f` receives the attribute name
   * and value as arguments.
   *
   * @example
   * builtins.mapAttrs (name: value: value * 10) { a = 1; b = 2; } == { a = 10; b = 20; }
   */
  mapAttrs(f: (name: string, value: any) => any): (attrset: Record<string, any>) => Record<string, any>;

  /**
   * Remove the attributes listed in `names` from `set`. The attributes don't have
   * to exist in `set`.
   *
   * @example
   * removeAttrs { x = 1; y = 2; z = 3; } [ "a" "x" "z" ] == { y = 2; }
   */
  removeAttrs(set: Record<string, any>): (names: string[]) => Record<string, any>;

  /**
   * Transpose a list of attribute sets into an attribute set of lists, then apply `mapAttrs`.
   * `f` receives two arguments: the attribute name and a non-empty list of all values
   * encountered for that attribute name. The result is an attribute set where the attribute
   * names are the union of the attribute names in each element of `list`. The attribute
   * values are the return values of `f`.
   */
  zipAttrsWith<T, R>(f: (name: string, values: T[]) => R): (list: Array<Record<string, T>>) => Record<string, R>;

  /**
   * Return a set containing the names of the formal arguments expected by the function `f`.
   * The value of each attribute is a Boolean denoting whether the corresponding argument
   * has a default value.
   *
   * "Formal argument" refers to the attributes of the set pattern; plain lambdas are not included.
   *
   * @example
   * functionArgs ({ x, y ? 123 }: ...) == { x = false; y = true; }
   */
  functionArgs(f: (...args: any[]) => any): Record<string, boolean>;

  // ── Type Checking ──────────────────────────────────────────────────────

  /**
   * Return a string representing the type of the value `e`, namely `"int"`, `"bool"`,
   * `"string"`, `"path"`, `"null"`, `"set"`, `"list"`, `"lambda"` or `"float"`.
   */
  typeOf(e: any): NixTypeName;

  /** Return `true` if `e` evaluates to a set, and `false` otherwise. */
  isAttrs(e: any): e is Record<string, any>;

  /** Return `true` if `e` evaluates to a bool, and `false` otherwise. */
  isBool(e: any): e is boolean;

  /** Return `true` if `e` evaluates to a float, and `false` otherwise. */
  isFloat(e: any): e is number;

  /** Return `true` if `e` evaluates to a function, and `false` otherwise. */
  isFunction(e: any): e is (...args: any[]) => any;

  /** Return `true` if `e` evaluates to an integer, and `false` otherwise. */
  isInt(e: any): e is number;

  /** Return `true` if `e` evaluates to a list, and `false` otherwise. */
  isList(e: any): e is any[];

  /**
   * Return `true` if `e` evaluates to `null`, and `false` otherwise.
   *
   * @deprecated This function is deprecated; just write `e == null` instead.
   */
  isNull(e: any): e is null;

  /** Return `true` if `e` evaluates to a path, and `false` otherwise. */
  isPath(e: any): e is Path;

  /** Return `true` if `e` evaluates to a string, and `false` otherwise. */
  isString(e: any): e is string;

  // ── Path / File ────────────────────────────────────────────────────────

  /**
   * Return the *base name* of the string `s`, that is, everything following the final
   * slash in the string. This is similar to the GNU `basename` command.
   */
  baseNameOf(s: string | Path): string;

  /**
   * Return the directory part of the string `s`, that is, everything before the final
   * slash in the string. This is similar to the GNU `dirname` command.
   */
  dirOf(s: string | Path): string;

  /** Return `true` if the path `path` exists at evaluation time, and `false` otherwise. */
  pathExists(path: Path | string): boolean;

  /**
   * Return the contents of the directory `path` as a set mapping directory entries
   * to the corresponding file type. The possible values for the file type are
   * `"regular"`, `"directory"`, `"symlink"` and `"unknown"`.
   *
   * @example
   * builtins.readDir ./A == { B = "regular"; C = "directory"; }
   */
  readDir(path: Path | string): Record<string, FileType>;

  /** Return the contents of the file `path` as a string. */
  readFile(path: Path | string): string;

  /**
   * Determine the directory entry type of a filesystem node, being one of
   * `"directory"`, `"regular"`, `"symlink"`, or `"unknown"`.
   */
  readFileType(path: Path | string): FileType;

  /**
   * Return a base-16 representation of the cryptographic hash of the file at path `p`.
   * The hash algorithm specified by `type` must be one of `"md5"`, `"sha1"`, `"sha256"` or `"sha512"`.
   */
  hashFile(type: HashAlgorithm): (path: Path | string) => string;

  /**
   * Look up the given path with the given search path. A search path is represented as a
   * list of attribute sets with two attributes, `prefix` and `path`. The lookup algorithm
   * checks each entry until a match is found, returning a path value of the match.
   *
   * The syntax `<nixpkgs>` is equivalent to `builtins.findFile builtins.nixPath "nixpkgs"`.
   */
  findFile(search: Array<{ prefix: string; path: string }>): (lookup: string) => Path;

  /**
   * Store the string `s` in a file in the Nix store and return its path. The file
   * has suffix `name`. This file can be used as an input to derivations. One application
   * is to write builders "inline".
   *
   * References to other store paths in `s` are tracked. It is not allowed to create
   * cyclic references or references to derivation outputs.
   */
  toFile(name: string): (s: string) => Path;

  /**
   * @deprecated Use `/. + "/path"` to convert a string into an absolute path.
   * For relative paths, use `./. + "/path"`.
   */
  toPath(s: string): Path;

  /**
   * This function allows you to define a dependency on an already existing store path.
   * Note that this differs from a plain path in that the latter causes the path to be
   * *copied* again to the Nix store, resulting in a new path.
   *
   * Not available in pure evaluation mode. See also `builtins.fetchClosure`.
   */
  storePath(path: string): Path;

  /**
   * Filters source files during Nix store import based on a predicate. The predicate
   * receives the full path and type identifier (`"regular"`, `"directory"`, `"symlink"`,
   * `"unknown"`). Excluding directories removes entire subtrees.
   *
   * **Warning:** Should not filter store paths directly as it produces indirect dependencies
   * on filtered-out files, causing spurious rebuilds. Use `builtins.path` instead.
   */
  filterSource(
    filter: (path: string) => (type: FileType) => boolean,
  ): (path: Path | string) => Path;

  /**
   * An enrichment of the built-in path type, based on the attributes present in `args`.
   * All are optional except `path`:
   * - `path`: the underlying path
   * - `name`: optional name for the path when added to the store
   * - `filter`: optional filter function with `filterSource` semantics
   * - `recursive`: optional boolean (defaults to `true`) for flat versus NAR hashing
   * - `sha256`: optional expected file hash for pure-eval compatibility
   */
  path(args: {
    path: Path | string;
    name?: string;
    filter?: (path: string) => (type: FileType) => boolean;
    recursive?: boolean;
    sha256?: string;
  }): Path;

  // ── Import ─────────────────────────────────────────────────────────────

  /**
   * Load, parse and return the Nix expression in the file `path`. The value `path`
   * can be a path, a string, or an attribute set with an `__toString` attribute or
   * a `outPath` attribute (as derivations or flake inputs typically have).
   *
   * If `path` is a directory, the file `default.nix` in that directory is loaded.
   * Evaluation aborts if the file doesn't exist or contains an incorrect Nix expression.
   *
   * Unlike some languages, `import` is a regular function in Nix. A loaded expression
   * must not contain free variables; therefore, it cannot refer to variables in scope
   * at the call site. To make variables available, pass them as function arguments.
   */
  import<T extends string>(path: T): T extends { readonly __import: infer M } ? M : any;

  /**
   * Import with a custom scope. Like `import`, but the Nix expression in the file
   * can refer to the attributes of `scope`.
   */
  scopedImport(scope: Record<string, any>): (path: Path | string) => any;

  // ── Fetchers ───────────────────────────────────────────────────────────

  /**
   * Download the specified URL and return the path of the downloaded file.
   * Not available in restricted evaluation mode.
   */
  fetchurl(url: string | { name?: string; url: string; sha256?: string; }): Path;

  /**
   * Download the specified URL, unpack it and return the path of the unpacked tree.
   * The file must be a tape archive (`.tar`) compressed with `gzip`, `bzip2` or `xz`.
   * The top-level path component of the files in the tarball is removed, so if a
   * tarball contains a file `foo-1.0/README`, this extracts to `README`.
   *
   * The fetched tarball is cached for a certain amount of time (1 hour by default)
   * in `~/.cache/nix/tarballs/`. The function can verify contents against a hash by
   * taking a set with `url` and `sha256` attributes.
   *
   * Not available in restricted evaluation mode.
   */
  fetchTarball(args: string | FetchTarballArgs): Path;

  /**
   * Fetch a path from git. `args` can be a URL, in which case the HEAD of the repo
   * at that URL is fetched. Otherwise, it can be an attribute set with attributes
   * including `url`, `name`, `rev`, `ref`, `submodules`, `shallow`, and `allRefs`.
   */
  fetchGit(args: string | FetchGitArgs): FetchGitResult;

  /** Fetch a Mercurial repository. */
  fetchMercurial(args: string | FetchMercurialArgs): {
    outPath: string;
    rev: string;
    revCount: number;
  };

  /** Fetch a source tree (experimental). */
  fetchTree(args: string | { type: string; [key: string]: NixValue }): {
    outPath: string;
    [key: string]: any;
  };

  /**
   * Retrieves store path closures from binary caches. Supports three invocation methods:
   * fetch content-addressed paths directly without key configuration, fetch input-addressed
   * paths and rewrite them to content-addressed equivalents, or fetch input-addressed
   * paths as-is (requiring trusted key configuration).
   *
   * Only available with the `fetch-closure` experimental feature enabled.
   */
  fetchClosure(args: FetchClosureArgs): Path;

  // ── Serialization ──────────────────────────────────────────────────────

  /**
   * Return a string containing a JSON representation of `e`. Strings, integers, floats,
   * booleans, nulls and lists are mapped to their JSON equivalents. Sets (except derivations)
   * are represented as objects. Derivations are translated to a JSON string containing the
   * derivation's output path. Paths are copied to the store and represented as a JSON string
   * of the resulting store path.
   */
  toJSON(e: any): string;

  /**
   * Convert a JSON string to a Nix value.
   *
   * @example
   * builtins.fromJSON '{"x": [1, 2, 3], "y": null}' == { x = [ 1 2 3 ]; y = null; }
   */
  fromJSON(e: string): any;

  /** Convert a TOML string to a Nix value. */
  fromTOML(e: string): any;

  /**
   * Return a string containing an XML representation of `e`. The main application for
   * `toXML` is to communicate information with the builder in a more structured format
   * than plain environment variables.
   */
  toXML(e: any): string;

  // ── String Context ─────────────────────────────────────────────────────

  /**
   * Return the string context of `s`. The string context tracks references to derivations
   * within a string. It is represented as an attribute set of store derivation paths mapping
   * to output names. Using string interpolation on a derivation will add that derivation
   * to the string context.
   */
  getContext(s: string): Record<string, StringContext>;

  /** Append string context entries to a string. */
  appendContext(s: string): (ctx: Record<string, StringContext>) => string;

  /** Return `true` if string `s` has a non-empty context. The context can be obtained with `getContext`. */
  hasContext(s: string): boolean;

  /** Remove the string context from `s`. This is unsafe as it may break dependency tracking. */
  unsafeDiscardStringContext(s: string): string;

  /** Remove output dependency from the string context of `s`. */
  unsafeDiscardOutputDependency(s: string): string;

  /** Add derivation output dependencies to the string context of `s`. */
  addDrvOutputDependencies(s: string): string;

  // ── Misc ───────────────────────────────────────────────────────────────

  /**
   * `getEnv` returns the value of the environment variable `s`, or an empty string
   * if the variable doesn't exist. This function should be used with care, as it can
   * introduce environment dependencies in your Nix expression.
   */
  getEnv(name: string): string;

  /**
   * Get the source position where attribute `name` is defined in `attrs`.
   * Returns `null` if the attribute doesn't exist. Unsafe; may return incorrect
   * results in some cases.
   */
  unsafeGetAttrPos(name: string): (attrs: Record<string, any>) => SourcePos;

  /** Convert between hash formats (base16, base32, base64, SRI). */
  convertHash(args: {
    hash: string;
    hashAlgo: HashAlgorithm;
    toHashFormat?: "base16" | "base32" | "base64" | "sri";
  }): string;

  // ── Flakes (experimental) ──────────────────────────────────────────────

  /**
   * Convert a flake reference from attribute set format to URL format.
   *
   * Only available if the `flakes` experimental feature is enabled.
   *
   * @example
   * builtins.flakeRefToString {
   *   dir = "lib"; owner = "NixOS"; ref = "23.05"; repo = "nixpkgs"; type = "github";
   * } == "github:NixOS/nixpkgs/23.05?dir=lib"
   */
  flakeRefToString(attrs: Record<string, any>): string;

  /**
   * Parse a flake reference, and return its exploded form.
   *
   * Only available if the `flakes` experimental feature is enabled.
   *
   * @example
   * builtins.parseFlakeRef "github:NixOS/nixpkgs/23.05?dir=lib"
   *   == { dir = "lib"; owner = "NixOS"; ref = "23.05"; repo = "nixpkgs"; type = "github"; }
   */
  parseFlakeRef(ref: string): Record<string, any>;

  /**
   * Fetch a flake from a flake reference, and return its output attributes and some metadata.
   *
   * Unless impure evaluation is allowed (`--impure`), the flake reference must be "locked",
   * e.g. contain a Git revision or content hash.
   *
   * Only available if the `flakes` experimental feature is enabled.
   *
   * @example
   * (builtins.getFlake "nix/55bc52401966fbffa525c574c14f67b00bc4fb3a").packages.x86_64-linux.nix
   */
  getFlake(ref: string): Record<string, any>;
}

declare const builtins: Builtins;

// ─── Non-prefixed top-level globals ──────────────────────────────────────────

declare const abort: Builtins["abort"];
declare const baseNameOf: Builtins["baseNameOf"];
declare const derivation: Builtins["derivation"];
declare const derivationStrict: Builtins["derivationStrict"];
declare const dirOf: Builtins["dirOf"];
declare const fetchGit: Builtins["fetchGit"];
declare const fetchMercurial: Builtins["fetchMercurial"];
declare const fetchTarball: Builtins["fetchTarball"];
declare const fetchTree: Builtins["fetchTree"];
declare const fromTOML: Builtins["fromTOML"];
declare const isNull: Builtins["isNull"];
declare const map: Builtins["map"];
declare const placeholder: Builtins["placeholder"];
declare const removeAttrs: Builtins["removeAttrs"];
declare const scopedImport: Builtins["scopedImport"];
declare const toString: Builtins["toString"];

// ─── Double-underscore prefixed globals ──────────────────────────────────────

declare const __add: Builtins["add"];
declare const __addDrvOutputDependencies: Builtins["addDrvOutputDependencies"];
declare const __addErrorContext: Builtins["addErrorContext"];
declare const __all: Builtins["all"];
declare const __any: Builtins["any"];
declare const __appendContext: Builtins["appendContext"];
declare const __attrNames: Builtins["attrNames"];
declare const __attrValues: Builtins["attrValues"];
declare const __bitAnd: Builtins["bitAnd"];
declare const __bitOr: Builtins["bitOr"];
declare const __bitXor: Builtins["bitXor"];
declare const __catAttrs: Builtins["catAttrs"];
declare const __ceil: Builtins["ceil"];
declare const __compareVersions: Builtins["compareVersions"];
declare const __concatLists: Builtins["concatLists"];
declare const __concatMap: Builtins["concatMap"];
declare const __concatStringsSep: Builtins["concatStringsSep"];
declare const __convertHash: Builtins["convertHash"];
declare const __currentSystem: Builtins["currentSystem"];
declare const __currentTime: Builtins["currentTime"];
declare const __deepSeq: Builtins["deepSeq"];
declare const __div: Builtins["div"];
declare const __elem: Builtins["elem"];
declare const __elemAt: Builtins["elemAt"];
declare const __fetchurl: Builtins["fetchurl"];
declare const __filter: Builtins["filter"];
declare const __filterSource: Builtins["filterSource"];
declare const __findFile: Builtins["findFile"];
declare const __flakeRefToString: Builtins["flakeRefToString"];
declare const __floor: Builtins["floor"];
declare const __fromJSON: Builtins["fromJSON"];
declare const __functionArgs: Builtins["functionArgs"];
declare const __genList: Builtins["genList"];
declare const __genericClosure: Builtins["genericClosure"];
declare const __getAttr: Builtins["getAttr"];
declare const __getContext: Builtins["getContext"];
declare const __getEnv: Builtins["getEnv"];
declare const __getFlake: Builtins["getFlake"];
declare const __groupBy: Builtins["groupBy"];
declare const __hasAttr: Builtins["hasAttr"];
declare const __hasContext: Builtins["hasContext"];
declare const __hashFile: Builtins["hashFile"];
declare const __hashString: Builtins["hashString"];
declare const __head: Builtins["head"];
declare const __intersectAttrs: Builtins["intersectAttrs"];
declare const __isAttrs: Builtins["isAttrs"];
declare const __isBool: Builtins["isBool"];
declare const __isFloat: Builtins["isFloat"];
declare const __isFunction: Builtins["isFunction"];
declare const __isInt: Builtins["isInt"];
declare const __isList: Builtins["isList"];
declare const __isPath: Builtins["isPath"];
declare const __isString: Builtins["isString"];
declare const __langVersion: Builtins["langVersion"];
declare const __length: Builtins["length"];
declare const __lessThan: Builtins["lessThan"];
declare const __listToAttrs: Builtins["listToAttrs"];
declare const __mapAttrs: Builtins["mapAttrs"];
declare const __match: Builtins["match"];
declare const __mul: Builtins["mul"];
declare const __nixPath: Builtins["nixPath"];
declare const __nixVersion: Builtins["nixVersion"];
declare const __parseDrvName: Builtins["parseDrvName"];
declare const __parseFlakeRef: Builtins["parseFlakeRef"];
declare const __partition: Builtins["partition"];
declare const __path: Builtins["path"];
declare const __pathExists: Builtins["pathExists"];
declare const __readDir: Builtins["readDir"];
declare const __readFile: Builtins["readFile"];
declare const __readFileType: Builtins["readFileType"];
declare const __replaceStrings: Builtins["replaceStrings"];
declare const __seq: Builtins["seq"];
declare const __sort: Builtins["sort"];
declare const __split: Builtins["split"];
declare const __splitVersion: Builtins["splitVersion"];
declare const __storeDir: Builtins["storeDir"];
declare const __storePath: Builtins["storePath"];
declare const __stringLength: Builtins["stringLength"];
declare const __sub: Builtins["sub"];
declare const __substring: Builtins["substring"];
declare const __tail: Builtins["tail"];
declare const __toFile: Builtins["toFile"];
declare const __toJSON: Builtins["toJSON"];
declare const __toPath: Builtins["toPath"];
declare const __toXML: Builtins["toXML"];
declare const __trace: Builtins["trace"];
declare const __traceVerbose: Builtins["traceVerbose"];
declare const __tryEval: Builtins["tryEval"];
declare const __typeOf: Builtins["typeOf"];
declare const __unsafeDiscardOutputDependency: Builtins["unsafeDiscardOutputDependency"];
declare const __unsafeDiscardStringContext: Builtins["unsafeDiscardStringContext"];
declare const __unsafeGetAttrPos: Builtins["unsafeGetAttrPos"];
declare const __warn: Builtins["warn"];
declare const __zipAttrsWith: Builtins["zipAttrsWith"];
declare const __curPos: { file: string; line: number; column: number };

// ─── Minimal global types required by TypeScript ─────────────────────────────
// These are normally provided by lib.es5.d.ts but we use noLib: true.

interface Boolean {}
interface CallableFunction extends Function {}
interface Function {}
interface IArguments {}
interface NewableFunction extends Function {}
interface Number {}
interface Object {}
interface RegExp {}
interface String {}

interface Array<T> {
  length: number;
  [n: number]: T;
}

interface ReadonlyArray<T> {
  length: number;
  [n: number]: T;
}

interface Record<K extends string | number | symbol, V> {
  [key: string]: V;
}

interface TemplateStringsArray extends ReadonlyArray<string> {}

type Partial<T> = { [P in keyof T]?: T[P] };
type Required<T> = { [P in keyof T]-?: T[P] };
type Readonly<T> = { readonly [P in keyof T]: T[P] };
type Pick<T, K extends keyof T> = { [P in K]: T[P] };
type Omit<T, K extends string | number | symbol> = Pick<T, Exclude<keyof T, K>>;
type Exclude<T, U> = T extends U ? never : T;
type Extract<T, U> = T extends U ? T : never;
type NonNullable<T> = T & {};
type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : any;
type Parameters<T extends (...args: any) => any> = T extends (...args: infer P) => any ? P : never;
type ConstructorParameters<T extends abstract new (...args: any) => any> = T extends abstract new (...args: infer P) => any ? P : never;
type InstanceType<T extends abstract new (...args: any) => any> = T extends abstract new (...args: any) => infer R ? R : any;



