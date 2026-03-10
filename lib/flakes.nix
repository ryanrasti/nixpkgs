/* @ts
import type { Lib } from "./default.nix";
*/
/**
  Flake operations.
*/
{
  # @ts: Lib
  lib }:
{

  inherit (builtins)
    parseFlakeRef
    flakeRefToString
    ;

}
