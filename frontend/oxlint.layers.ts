import type { OxlintOverride } from "oxlint";

const RENDER = ["src/components/**/*.{ts,tsx}", "src/pages/**/*.{ts,tsx}", "src/App.tsx"];
const ORCHESTRATION = ["src/hooks/**/*.{ts,tsx}", "src/context/**/*.{ts,tsx}"];
const DATA_HOOKS = ["src/hooks/queries/**/*.ts", "src/hooks/mutations/**/*.ts"];
const PURE = ["src/domain/**/*.{ts,tsx}", "src/utils/**/*.{ts,tsx}", "src/types/**/*.{ts,tsx}"];
const API = ["src/api/**/*.{ts,tsx}"];
const COMPOSITION_ROOT = ["src/main.tsx"];
const EVERY_SOURCE_FILE = ["src/**/*.{ts,tsx}"];
const RENDER_TESTS = ["src/components/**/*.test.{ts,tsx}", "src/pages/**/*.test.{ts,tsx}"];
const PURE_TESTS = ["src/domain/**/*.test.{ts,tsx}", "src/utils/**/*.test.{ts,tsx}"];
const TRANSPORT_TESTS = ["src/api/**/*.test.{ts,tsx}"];
const CACHE_KEY_ASSERTING_TESTS = ["src/api/**/*.test.{ts,tsx}", "src/hooks/**/*.test.{ts,tsx}"];

const apiAny = ["**/api/*", "**/api/**"];
const apiEndpoints = ["**/api/endpoints", "**/api/endpoints.ts", "**/api/endpoints/**"];
const apiTransport = ["**/api/client", "**/api/client.ts", "**/api/queryClient", "**/api/queryClient.ts"];
const reactRuntime = ["react", "react-dom", "@tanstack/react-query"];
const reactQuery = ["@tanstack/react-query"];
const upward = ["**/components/**", "**/pages/**", "**/hooks/**", "**/context/**"];

const renderApiMessage =
    "The render layer may not import src/api. Read the data from a hook in src/hooks and destructure it.";
const renderQueryMessage =
    "The render layer may not import react-query. Wrap the query in a data hook under src/hooks/queries or src/hooks/mutations.";
const transportMessage =
    "Only src/api, src/hooks/queries, src/hooks/mutations and src/main.tsx may import the transport modules api/client, api/queryClient and api/endpoints.";
const pureApiMessage = "The pure layer may not import src/api. A pure module takes values and returns values.";
const pureReactMessage =
    "The pure layer may not import react, react-dom or react-query. A module that needs them belongs in src/hooks.";
const adapterUpwardMessage =
    "src/api may not import upward from components, pages, hooks or context. Inject what the adapter needs.";

export const layerRules: OxlintOverride[] = [
    {
        files: DATA_HOOKS,
        rules: {
            "no-restricted-imports": "off",
        },
    },
    {
        files: ORCHESTRATION,
        excludeFiles: DATA_HOOKS,
        rules: {
            "no-restricted-imports": [
                "error",
                {
                    patterns: [{ group: [...apiTransport, ...apiEndpoints], message: transportMessage }],
                },
            ],
        },
    },
    {
        files: RENDER,
        rules: {
            "no-restricted-imports": [
                "error",
                {
                    patterns: [
                        { group: apiAny, message: renderApiMessage, allowTypeImports: false },
                        { group: reactQuery, message: renderQueryMessage, allowTypeImports: false },
                    ],
                },
            ],
        },
    },
    {
        files: PURE,
        rules: {
            "no-restricted-imports": [
                "error",
                {
                    patterns: [
                        { group: apiAny, message: pureApiMessage },
                        { group: reactRuntime, message: pureReactMessage },
                    ],
                },
            ],
        },
    },
    {
        files: API,
        rules: {
            "no-restricted-imports": [
                "error",
                {
                    patterns: [{ group: upward, message: adapterUpwardMessage }],
                },
            ],
        },
    },
    {
        files: EVERY_SOURCE_FILE,
        excludeFiles: [...RENDER, ...DATA_HOOKS, ...ORCHESTRATION, ...PURE, ...API, ...COMPOSITION_ROOT],
        rules: {
            "no-restricted-imports": [
                "error",
                {
                    patterns: [{ group: [...apiTransport, ...apiEndpoints], message: transportMessage }],
                },
            ],
        },
    },
    {
        files: EVERY_SOURCE_FILE,
        rules: {
            "layers/no-raw-query-key": "error",
            "layers/no-dynamic-api-import": "error",
            "layers/no-stub-global-fetch": "error",
        },
    },
    {
        files: RENDER_TESTS,
        rules: {
            "layers/no-transport-mock-in-render-test": "error",
        },
    },
    {
        files: PURE_TESTS,
        rules: {
            "layers/no-render-import-in-pure-test": "error",
        },
    },
    {
        files: TRANSPORT_TESTS,
        rules: {
            "layers/no-stub-global-fetch": "off",
        },
    },
    {
        files: CACHE_KEY_ASSERTING_TESTS,
        rules: {
            "layers/no-raw-query-key": "off",
        },
    },
    {
        files: ["src/api/queryKeys.ts"],
        rules: {
            "layers/no-raw-query-key": "off",
        },
    },
];
