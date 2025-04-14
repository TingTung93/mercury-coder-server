// Export all code-related tools
export { AnalyzeCodeTool } from "./analyzeCodeTool.js";
export { RefactorCodeTool } from "./refactorCodeTool.js";
export { DebugCodeTool } from "./debugCodeTool.js";
export { GenerateCodeTool } from "./generateCodeTool.js";
export { FormatCodeTool } from "./formatCodeTool.js";
export { ConvertCodeTool } from "./convertCodeTool.js";
export { DocumentCodeTool } from "./documentCodeTool.js";

// Import all tools for the getAllCodeTools function
import { AnalyzeCodeTool } from "./analyzeCodeTool.js";
import { RefactorCodeTool } from "./refactorCodeTool.js";
import { DebugCodeTool } from "./debugCodeTool.js";
import { GenerateCodeTool } from "./generateCodeTool.js";
import { FormatCodeTool } from "./formatCodeTool.js";
import { ConvertCodeTool } from "./convertCodeTool.js";
import { DocumentCodeTool } from "./documentCodeTool.js";
import { LocalTool } from "../index.js";

/**
 * Get all code-related tools as an array of LocalTool instances
 */
export function getAllCodeTools(): LocalTool[] {
    return [
        new AnalyzeCodeTool(),
        new RefactorCodeTool(),
        new DebugCodeTool(),
        new GenerateCodeTool(),
        new FormatCodeTool(),
        new ConvertCodeTool(),
        new DocumentCodeTool()
    ];
} 