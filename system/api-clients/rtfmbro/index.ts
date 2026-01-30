/**
 * rtfmbro MCP Client - Exports
 */

export {
  getReadme,
  getDocumentationTree,
  readFiles,
  searchGitHub,
  getPackageInfo
} from './client.js';

export type {
  GetReadmeOptions,
  GetDocumentationTreeOptions,
  ReadFilesOptions,
  SearchGitHubOptions,
  ReadmeResponse,
  DocTreeResponse,
  ReadFilesResponse,
  SearchResponse
} from './client.js';
