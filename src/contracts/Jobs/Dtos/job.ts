export type JobType = "full-time" | "part-time" | "internship" | "contract" | "freelance" | "training";
export type JobLevel = "entry" | "mid" | "senior" | "lead" | "manager" | "executive" | "internship" | "unknown";
export type JobLocationType = "remote" | "hybrid" | "onsite";

export interface JobLocation {
  city: string | null;
  region: string | null;
  country: string | null;
  display: string;
}

export interface JobSalary {
  min: number | null;
  max: number | null;
  currency: string;
  display: string | null;
}

export interface JobCompany {
  name: string;
  logoUrl: string | null;
}

export interface Job {
  id: string;
  title: string;
  designation: string;          // cleaned, normalized job title
  level: JobLevel;              // seniority derived from title
  type: JobType;                // full-time, internship, etc.
  locationType: JobLocationType; // remote, hybrid, onsite
  location: JobLocation;
  company: JobCompany;
  salary: JobSalary;
  description: string;
  tags: string[];               // skills / keywords
  applyUrl: string;
  postedAt: string | null;
  expiresAt: string | null;
  source: "adzuna";
}
