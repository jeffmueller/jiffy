import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Jiffy renders animated GIFs straight from the provider CDNs. next/image
      // is deliberately unused — it would proxy every frame through the
      // optimizer for no benefit — so next.config.ts carries no images config
      // and plain <img>/<video> is the intended element here.
      "@next/next/no-img-element": "off",

      // Allow deliberately unused bindings when prefixed with an underscore,
      // e.g. interface methods a provider cannot implement.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
]);

export default eslintConfig;
