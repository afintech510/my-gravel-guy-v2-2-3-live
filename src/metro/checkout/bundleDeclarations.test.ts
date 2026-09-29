// Guards G2 (docs/metro/research/metro-checkout-rereview.md): the checked-in
// supabase/functions/_shared/metro-checkout.bundle.d.ts must exist and must actually export (as
// real `interface` declarations, not just substrings) every type-only name
// _shared/metro-conversion-runner.ts imports from the bundle via its
// `// @deno-types="./metro-checkout.bundle.d.ts"` directive. Without this file (or if it drifted
// out of sync with the names actually imported), `deno check`/a Deno-aware editor would report
// "module has no exported member" for those names — this test fails loudly with a regeneration
// hint instead of that gap going unnoticed, mirroring bundleParity.test.ts's pattern for the .js
// bundle.
import { describe, expect, it, beforeAll } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const DTS_PATH = path.resolve(__dirname, '../../../supabase/functions/_shared/metro-checkout.bundle.d.ts');
const REGEN_HINT = 'metro-checkout.bundle.d.ts is missing or stale. Run: node scripts/metro/export-metro-checkout-bundle.mjs';

// Every type-only name actually imported from the bundle today — keep in sync with
// _shared/metro-conversion-runner.ts's `import type { ... } from "./metro-checkout.bundle.js"`
// list. Cross-checked here against BOTH the bundle.js's own export list (still real named exports
// at the type level, even though esbuild erases their shape) and the runner's source text.
const REQUIRED_TYPE_EXPORTS = [
  'MetroOrderEmailData',
  'MetroOrderErrorAlertData',
  'MetroServerQuote',
  'MinimalStripeSession',
  'ParsedMetroCheckout',
];

describe('metro-checkout.bundle.d.ts (G2)', () => {
  it('exists', () => {
    expect(existsSync(DTS_PATH), REGEN_HINT).toBe(true);
  });

  let exportedInterfaceNames: Set<string>;
  let dtsText: string;

  beforeAll(() => {
    if (!existsSync(DTS_PATH)) throw new Error(REGEN_HINT);
    dtsText = readFileSync(DTS_PATH, 'utf8');
    const sourceFile = ts.createSourceFile('metro-checkout.bundle.d.ts', dtsText, ts.ScriptTarget.Latest, true);
    exportedInterfaceNames = new Set(
      sourceFile.statements
        .filter((s): s is ts.InterfaceDeclaration => ts.isInterfaceDeclaration(s))
        .filter(s => s.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword))
        .map(s => s.name.text),
    );
  });

  it.each(REQUIRED_TYPE_EXPORTS)('exports interface %s', name => {
    expect(exportedInterfaceNames.has(name), REGEN_HINT).toBe(true);
  });

  it('parses as valid, self-contained TypeScript with no diagnostics', () => {
    const fileName = 'metro-checkout.bundle.d.ts';
    // types: [] — otherwise the TS API auto-includes every package under node_modules/@types
    // (this repo's app code, react, mapbox, vitest, etc.), which have nothing to do with
    // whether THIS file is valid, self-contained TypeScript.
    const compilerOptions: ts.CompilerOptions = { skipLibCheck: true, strict: false, noImplicitAny: false, types: [] };
    const baseHost = ts.createCompilerHost(compilerOptions, true);
    const compilerHost: ts.CompilerHost = {
      ...baseHost,
      fileExists: f => f === fileName || baseHost.fileExists(f),
      readFile: f => (f === fileName ? dtsText : baseHost.readFile(f)),
      getSourceFile: (f, languageVersion, onError, shouldCreateNewSourceFile) =>
        f === fileName
          ? ts.createSourceFile(f, dtsText, languageVersion, true)
          : baseHost.getSourceFile(f, languageVersion, onError, shouldCreateNewSourceFile),
    };
    const program = ts.createProgram([fileName], compilerOptions, compilerHost);
    const diagnostics = ts.getPreEmitDiagnostics(program);
    const formatted = diagnostics.map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n')).join('\n');
    expect(diagnostics.length, `${REGEN_HINT}\n${formatted}`).toBe(0);
  });
});
