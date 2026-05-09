import type { SearchJobsCommand } from "../../contracts/Jobs/Commands/searchJobsCommand";
import type { Job, JobLevel, JobLocationType, JobType } from "../../contracts/Jobs/Dtos/job";

const ADZUNA_BASE = "https://api.adzuna.com/v1/api/jobs";

function getAdzunaAppId(): string {
  return process.env.ADZUNA_APP_ID || "";
}

function getAdzunaAppKey(): string {
  return process.env.ADZUNA_APP_KEY || "";
}

function isAdzunaConfigured(): boolean {
  return Boolean(getAdzunaAppId() && getAdzunaAppKey());
}

// ─── Level detection from title ──────────────────────────────────────────────

function deriveLevel(title: string): JobLevel {
  const t = title.toLowerCase();
  if (t.includes("intern")) return "internship";
  if (t.includes("trainee") || t.includes("training") || t.includes("graduate")) return "entry";
  if (t.includes("junior") || t.includes("jr.") || t.includes("entry")) return "entry";
  if (t.includes("senior") || t.includes("sr.") || t.includes("lead")) return "senior";
  if (t.includes("lead") || t.includes("principal") || t.includes("staff")) return "lead";
  if (t.includes("manager") || t.includes("head of") || t.includes("director")) return "manager";
  if (t.includes("vp") || t.includes("vice president") || t.includes("cto") || t.includes("ceo")) return "executive";
  if (t.includes("mid") || t.includes("intermediate")) return "mid";
  return "unknown";
}

// ─── Job type detection ───────────────────────────────────────────────────────

function deriveJobType(title: string, contractType?: string): JobType {
  const t = (title + " " + (contractType || "")).toLowerCase();
  if (t.includes("intern")) return "internship";
  if (t.includes("train")) return "training";
  if (t.includes("freelance") || t.includes("freelancer")) return "freelance";
  if (t.includes("contract") || t.includes("contractor")) return "contract";
  if (t.includes("part time") || t.includes("part-time")) return "part-time";
  return "full-time";
}

// ─── Location type detection ──────────────────────────────────────────────────

function deriveLocationType(title: string, description: string): JobLocationType {
  const t = (title + " " + description).toLowerCase();
  if (t.includes("remote")) return "remote";
  if (t.includes("hybrid")) return "hybrid";
  return "onsite";
}

// ─── Designation normalization ────────────────────────────────────────────────

function normalizeDesignation(title: string): string {
  return title
    .replace(/\(.*?\)/g, "")
    .replace(/[-|/].*$/, "")
    .trim();
}

// ─── Tags extraction ──────────────────────────────────────────────────────────

const KNOWN_TAGS = [
  "react", "node", "python", "java", "typescript", "javascript", "angular", "vue",
  "aws", "azure", "gcp", "docker", "kubernetes", "sql", "mongodb", "postgresql",
  "machine learning", "data science", "ai", "devops", "flutter", "android", "ios",
  "figma", "ui/ux", "product management", "marketing", "sales", "finance", "hr",
  "content writing", "seo", "graphic design", "excel", "power bi", "tableau",
];

function extractTags(title: string, description: string): string[] {
  const text = (title + " " + description).toLowerCase();
  return KNOWN_TAGS.filter((tag) => text.includes(tag));
}

// ─── Adzuna response shape ────────────────────────────────────────────────────

interface AdzunaJob {
  id: string;
  title: string;
  description: string;
  redirect_url: string;
  created: string;
  contract_type?: string;
  salary_min?: number;
  salary_max?: number;
  company: { display_name: string };
  location: {
    display_name: string;
    area?: string[];
  };
  category: { label: string };
}

interface AdzunaResponse {
  results: AdzunaJob[];
  count: number;
}

// ─── Map Adzuna job to our Job DTO ────────────────────────────────────────────

function mapAdzunaJob(raw: AdzunaJob): Job {
  const description = raw.description || "";
  const title = raw.title || "";
  const area = raw.location?.area || [];

  return {
    id: raw.id,
    title,
    designation: normalizeDesignation(title),
    level: deriveLevel(title),
    type: deriveJobType(title, raw.contract_type),
    locationType: deriveLocationType(title, description),
    location: {
      city: area[area.length - 1] || null,
      region: area[area.length - 2] || null,
      country: area[0] || null,
      display: raw.location?.display_name || "",
    },
    company: {
      name: raw.company?.display_name || "",
      logoUrl: null,
    },
    salary: {
      min: raw.salary_min || null,
      max: raw.salary_max || null,
      currency: "INR",
      display:
        raw.salary_min && raw.salary_max
          ? `₹${raw.salary_min.toLocaleString()} - ₹${raw.salary_max.toLocaleString()}`
          : raw.salary_min
          ? `From ₹${raw.salary_min.toLocaleString()}`
          : null,
    },
    description: description.slice(0, 500),
    tags: extractTags(title, description),
    applyUrl: raw.redirect_url,
    postedAt: raw.created || null,
    expiresAt: null,
    source: "adzuna",
  };
}

// ─── Server-side filters ──────────────────────────────────────────────────────

function applyFilters(jobs: Job[], command: SearchJobsCommand): Job[] {
  let result = jobs;

  if (command.type) {
    result = result.filter((j) => j.type === command.type);
  }

  if (command.level) {
    result = result.filter((j) => j.level === command.level);
  }

  if (command.locationType) {
    result = result.filter((j) => j.locationType === command.locationType);
  }

  if (command.salaryMin) {
    result = result.filter((j) => j.salary.min !== null && j.salary.min >= command.salaryMin!);
  }

  if (command.salaryMax) {
    result = result.filter((j) => j.salary.max !== null && j.salary.max <= command.salaryMax!);
  }

  if (command.company) {
    const co = command.company.toLowerCase();
    result = result.filter((j) => j.company.name.toLowerCase().includes(co));
  }

  if (command.tags && command.tags.length > 0) {
    const filterTags = command.tags.map((t) => t.toLowerCase());
    result = result.filter((j) => filterTags.some((t) => j.tags.includes(t)));
  }

  if (command.postedWithinDays) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - command.postedWithinDays);
    result = result.filter((j) => j.postedAt && new Date(j.postedAt) >= cutoff);
  }

  return result;
}

// ─── Main search function ─────────────────────────────────────────────────────

async function searchJobs(command: SearchJobsCommand) {
  if (!isAdzunaConfigured()) {
    throw Object.assign(new Error("Job search service is not configured"), { statusCode: 503 });
  }

  const country = (command.country || "in").toLowerCase();
  const page = Math.max(1, Math.floor(Number(command.page || 1)));
  const pageSize = Math.max(1, Math.min(50, Math.floor(Number(command.pageSize || 10))));

  const params = new URLSearchParams({
    app_id: getAdzunaAppId(),
    app_key: getAdzunaAppKey(),
    results_per_page: String(Math.min(pageSize * 3, 50)),
  });

  if (command.q) params.set("what", command.q);
  if (command.location) params.set("where", command.location);
  if (command.salaryMin) params.set("salary_min", String(command.salaryMin));
  if (command.salaryMax) params.set("salary_max", String(command.salaryMax));
  if (command.type === "internship") params.set("what_or", "intern internship");
  if (command.type === "training") params.set("what_or", "trainee graduate");

  const url = `${ADZUNA_BASE}/${country}/search/${page}?${params.toString()}`;
  console.log("Adzuna request URL:", url);

  const response = await fetch(url);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Adzuna error:", response.status, errorText);
    throw Object.assign(
      new Error(`Job provider returned ${response.status}`),
      { statusCode: 502 }
    );
  }

  const data = (await response.json()) as AdzunaResponse;
  const mapped = (data.results || []).map(mapAdzunaJob);
  const filtered = applyFilters(mapped, command);
  const paginated = filtered.slice(0, pageSize);
  const total = data.count || 0;

  return {
    items: paginated,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      hasNext: page * pageSize < total,
      hasPrev: page > 1,
    },
    filters: {
      country,
      location: command.location || null,
      type: command.type || null,
      level: command.level || null,
      locationType: command.locationType || null,
    },
  };
}

export { searchJobs };
