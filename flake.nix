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
          pkgs.nodejs
        ];
        shellHook = ''
          cd "$FLAKE_ROOT/tests"
          npm install
        '';
      };
      mission-control = {
        wrapperName = "run";
        scripts = {
          "test" = {
            description = "Run test";
            exec = ''
              cd "$FLAKE_ROOT/tests"
              npm run test
            '';
          };
          "clean" = {
            description = "Clean up dist";
            exec = ''
              rm -rf "$FLAKE_ROOT/dist"
            '';
          };
          "prebuild" = {
            exec = ''
              sed -i 's/export /\/*export*\//' src/main.js
            '';
          };
          "postbuild" = {
            exec = ''
              sed -i 's/\/\*export\*\//export /' src/main.js
            '';
          };
          "devbuild" = {
            description = "Dev-build this web extension from src to dist, overwriting existing artifact of the same version.";
            exec = ''
              run prebuild
              web-ext build \
                --source-dir "$FLAKE_ROOT/src" \
                --artifacts-dir "$FLAKE_ROOT/dist" \
                --overwrite-dest || :
              run postbuild
            '';
          };
          "build" = {
            description = "Production-build this web extension from src to dist. The same version of artifact MUST NOT already exists in dist.";
            exec = ''
              run prebuild
              web-ext build \
                --source-dir "$FLAKE_ROOT/src" \
                --artifacts-dir "$FLAKE_ROOT/dist" || :
              run postbuild
            '';
          };
        };
      };
    };
  };
}
