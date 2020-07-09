{
  "compilerOptions": {
    "exclude": "lib",
      "outDir": "dist",
        "lib": ["es2018"],
          "module": "CommonJS",
            "esModuleInterop": false,
              "target": "ES2018",
                "preserveConstEnums": true,
                  "sourceMap": true,
                    "declaration": true,
                      "types": ["node", "jest", "chai"],
                        "forceConsistentCasingInFileNames": true,
                          "noImplicitReturns": true,
                            "alwaysStrict": true,
                              "strictFunctionTypes": true,
                                "jsx": "react"
  },
  "include": ["src"],
    "exclude": ["lib"]
}
