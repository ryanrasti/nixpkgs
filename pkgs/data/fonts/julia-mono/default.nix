{ lib, stdenvNoCC, fetchzip }:

stdenvNoCC.mkDerivation rec {
  pname = "JuliaMono-ttf";
  version = "0.047";

  src = fetchzip {
    url = "https://github.com/cormullion/juliamono/releases/download/v${version}/${pname}.tar.gz";
    stripRoot = false;
    hash = "sha256-tCZo48SBGdhcsP1wgaWkfWr3L3Yz+p/iqesLmarSWbk=";
  };

  installPhase = ''
    runHook preInstall

    mkdir -p $out/share/fonts/truetype
    mv *.ttf $out/share/fonts/truetype

    runHook postInstall
  '';

  meta = with lib; {
    description = "A monospaced font for scientific and technical computing";
    longDescription = ''
      JuliaMono is a monospaced typeface designed for use in text editing
      environments that require a wide range of specialist and technical Unicode
      characters. It was intended as a fun experiment to be presented at the
      2020 JuliaCon conference in Lisbon, Portugal (which of course didn’t
      physically happen in Lisbon, but online).
    '';
    maintainers = with maintainers; [ suhr ];
    platforms = with platforms; all;
    homepage = "https://juliamono.netlify.app/";
    license = licenses.ofl;
  };
}
