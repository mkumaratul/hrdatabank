// Import the implementation directly — pdf-parse's index.js runs debug/demo
// code at module load time when bundlers make `module.parent` falsy.
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import mammoth from "mammoth";

export const SKILL_CATEGORIES: Record<string, string[]> = {
  Tech: [
    "javascript", "typescript", "python", "java ", "react", "node.js", "nodejs",
    "sql", "software engineer", "software developer", "backend", "frontend",
    "full stack", "devops", "machine learning", "data science", "c++", "golang",
    "aws", "azure", "cloud engineer", "api development", "django", "spring boot",
  ],
  "Creative Designer": [
    "graphic design", "photoshop", "illustrator", "figma", "ui/ux", "ui designer",
    "ux designer", "branding", "typography", "adobe creative", "canva",
    "visual design", "logo design", "indesign",
  ],
  "Video Editor": [
    "video editing", "premiere pro", "after effects", "final cut pro",
    "davinci resolve", "motion graphics", "videographer", "video production",
    "color grading", "cinematography",
  ],
  Marketing: [
    "digital marketing", "seo", "sem", "content marketing", "social media marketing",
    "marketing strategy", "brand marketing", "google ads", "facebook ads",
    "performance marketing", "growth marketing",
  ],
  Sales: [
    "sales executive", "business development", "lead generation", "account manager",
    "sales representative", "crm", "b2b sales", "inside sales",
  ],
  "HR": [
    "human resources", "recruitment", "talent acquisition", "hr generalist",
    "payroll", "employee relations", "hr business partner", "onboarding",
  ],
  Finance: [
    "accounting", "financial analysis", "bookkeeping", "audit", "tally",
    "financial modeling", "cpa", "chartered accountant", "taxation",
  ],
  Writer: [
    "content writer", "copywriter", "blogging", "technical writing",
    "proofreading", "content strategy", "scriptwriting",
  ],
};

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_REGEX = /(\+?\d{1,3}[\s.-]?)?(\(?\d{3,5}\)?[\s.-]?)\d{3,4}[\s.-]?\d{3,4}/;

export interface ParsedResume {
  rawText: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  skillCategory: string;
}

export async function extractText(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === "application/pdf") {
    const result = await pdfParse(buffer);
    return result.text;
  }

  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  return buffer.toString("utf-8");
}

function guessName(text: string, fallbackFileName: string): string | null {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines.slice(0, 8)) {
    const words = line.split(/\s+/);
    const looksLikeName =
      words.length >= 2 &&
      words.length <= 4 &&
      !line.includes("@") &&
      !/\d/.test(line) &&
      line.length < 60;
    if (looksLikeName) return line;
  }

  return fallbackFileName.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ") || null;
}

function guessSkillCategory(text: string): string {
  const lower = text.toLowerCase();
  let bestCategory = "Uncategorized";
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(SKILL_CATEGORIES)) {
    const score = keywords.reduce(
      (count, kw) => count + (lower.includes(kw) ? 1 : 0),
      0,
    );
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return bestCategory;
}

export async function parseResume(
  buffer: Buffer,
  mimeType: string,
  fileName: string,
): Promise<ParsedResume> {
  const rawText = await extractText(buffer, mimeType);

  const emailMatch = rawText.match(EMAIL_REGEX);
  const phoneMatch = rawText.match(PHONE_REGEX);

  return {
    rawText,
    name: guessName(rawText, fileName),
    email: emailMatch ? emailMatch[0] : null,
    phone: phoneMatch ? phoneMatch[0].trim() : null,
    skillCategory: guessSkillCategory(rawText),
  };
}
