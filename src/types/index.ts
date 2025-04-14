import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";

// Base interface for code-related arguments
export interface CodeBaseArgs {
  code: string;
  language: string;
}

// Tool-specific interfaces
export interface AnalyzeCodeArgs extends CodeBaseArgs {}

export interface RefactorCodeArgs extends CodeBaseArgs {
  instructions?: string;
}

export interface DebugCodeArgs extends CodeBaseArgs {
  error?: string;
}

export interface GenerateCodeArgs {
  instructions: string;
  language: string;
  template?: string;
}

export interface FormatCodeArgs extends CodeBaseArgs {
  style?: string;
}

export interface ConvertCodeArgs extends CodeBaseArgs {
  targetLanguage: string;
}

export interface DocumentCodeArgs extends CodeBaseArgs {
  style?: string;
  format?: 'markdown' | 'jsdoc' | 'javadoc';
}

// Type guards
export function isCodeBaseArgs(args: unknown): args is CodeBaseArgs {
  return (
    typeof args === "object" &&
    args !== null &&
    typeof (args as CodeBaseArgs).code === "string" &&
    typeof (args as CodeBaseArgs).language === "string"
  );
}

export function isAnalyzeCodeArgs(args: unknown): args is AnalyzeCodeArgs {
  return isCodeBaseArgs(args);
}

export function isRefactorCodeArgs(args: unknown): args is RefactorCodeArgs {
  return (
    isCodeBaseArgs(args) &&
    (typeof (args as RefactorCodeArgs).instructions === "string" ||
      (args as RefactorCodeArgs).instructions === undefined)
  );
}

export function isDebugCodeArgs(args: unknown): args is DebugCodeArgs {
  return (
    isCodeBaseArgs(args) &&
    (typeof (args as DebugCodeArgs).error === "string" ||
      (args as DebugCodeArgs).error === undefined)
  );
}

export function isGenerateCodeArgs(args: unknown): args is GenerateCodeArgs {
  return (
    typeof args === "object" &&
    args !== null &&
    typeof (args as GenerateCodeArgs).instructions === "string" &&
    typeof (args as GenerateCodeArgs).language === "string" &&
    (typeof (args as GenerateCodeArgs).template === "string" ||
      (args as GenerateCodeArgs).template === undefined)
  );
}

export function isFormatCodeArgs(args: unknown): args is FormatCodeArgs {
  return (
    isCodeBaseArgs(args) &&
    (typeof (args as FormatCodeArgs).style === "string" ||
      (args as FormatCodeArgs).style === undefined)
  );
}

export function isConvertCodeArgs(args: unknown): args is ConvertCodeArgs {
  return (
    isCodeBaseArgs(args) &&
    typeof (args as ConvertCodeArgs).targetLanguage === "string"
  );
}

export function isDocumentCodeArgs(args: unknown): args is DocumentCodeArgs {
  return (
    isCodeBaseArgs(args) &&
    (typeof (args as DocumentCodeArgs).style === "string" ||
      (args as DocumentCodeArgs).style === undefined) &&
    ((args as DocumentCodeArgs).format === undefined ||
      ['markdown', 'jsdoc', 'javadoc'].includes((args as DocumentCodeArgs).format!))
  );
}

export { McpError, ErrorCode };