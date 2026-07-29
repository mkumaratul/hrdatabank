declare module "pdf-parse/lib/pdf-parse.js" {
  import { PDFInfo, PDFMetadata, Result } from "pdf-parse";

  function pdfParse(
    dataBuffer: Buffer,
    options?: Record<string, unknown>,
  ): Promise<Result>;

  export default pdfParse;
  export type { PDFInfo, PDFMetadata, Result };
}
