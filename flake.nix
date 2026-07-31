{
  inputs = {
    private-configuration.url = "git+ssh://git@github.com/kanarus/private-configuration";
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    systems.url = "github:nix-systems/default";
    flake-parts.url = "github:hercules-ci/flake-parts";
    mission-control.url = "github:Platonic-Systems/mission-control";
    flake-root.url = "github:srid/flake-root";
  };

  outputs = inputs: inputs.flake-parts.lib.mkFlake { inherit inputs; } {
    systems = import inputs.systems;
    imports = [
      inputs.mission-control.flakeModule
      inputs.flake-root.flakeModule
    ];
    perSystem = { config, pkgs, ... }: {
      devShells.default = pkgs.mkShell {
        inputsFrom = [
          config.mission-control.devShell
          config.flake-root.devShell
        ];
        packages = [
          pkgs.web-ext
        ];
      };
      mission-control = {
        wrapperName = "run";
        scripts = {
          build = {
            description = "Build this web extension from src to dist";
            exec = ''
              rm -rf "$FLAKE_ROOT/dist"
              web-ext build --source-dir "$FLAKE_ROOT/src" --artifacts-dir "$FLAKE_ROOT/dist"
            '';
          };
        };
      };
    };
  };
}
