import js from "@eslint/js";
import tseslint from "typescript-eslint";
import hooks from "eslint-plugin-react-hooks";

export default [
  { ignores: ["dist/**", "coverage/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["apps/**/*.{ts,tsx}", "packages/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
  {
    files: ["apps/**/*.{ts,tsx}", "packages/**/*.{ts,tsx}"],
    ignores: ["**/types.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "BinaryExpression[operator=/^(==|===|!=|!==)$/] > :matches(Literal[raw=/^[\"']/], TemplateLiteral[expressions.length=0])",
          message:
            "Compare text through a named constant in the owning module.",
        },
        {
          selector:
            "SwitchCase > :matches(Literal.test[raw=/^[\"']/], TemplateLiteral.test[expressions.length=0])",
          message: "Use a named constant for a string case.",
        },
        {
          selector: "TSTypeAliasDeclaration, TSInterfaceDeclaration",
          message:
            "Declare types and interfaces in the owning module's types.ts.",
        },
      ],
    },
  },
  {
    files: ["**/*.tsx"],
    plugins: { "react-hooks": hooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
    },
  },
];
