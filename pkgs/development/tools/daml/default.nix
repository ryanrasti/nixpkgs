{ lib, stdenv, jdk }:
let 
  tarball = fetchTarball {
    url = "https://github.com/digital-asset/daml/releases/download/v2.3.2/daml-sdk-2.3.2-linux.tar.gz";
    sha256 = "02rjga57fckmyb8jk1as5376iyk7wpdqh603b456p01hk38id3mc";
  };
in
  stdenv.mkDerivation {
    name = "daml-sdk";
    version = "2.3.2";
    src = tarball;
    buildPhase = "patchShebangs .";
    installPhase = "DAML_HOME=$out ./install.sh";
    propagatedBuildInputs = [ jdk ];
    meta = with lib; {
      description = "SDK for Daml smart contract language";
      homepage = "https://github.com/digital-asset/daml";
      license = licenses.asl20;
      # TODO: maintainers
    };
  }
