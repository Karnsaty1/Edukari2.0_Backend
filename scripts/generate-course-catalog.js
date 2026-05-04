const fs = require("fs");
const path = require("path");

const outputPath = path.join(__dirname, "..", "src", "data", "course-catalog.json");

const courseSpecs = [
  {
    title: "JavaScript Fundamentals",
    slug: "javascript-fundamentals",
    description:
      "Core JavaScript concepts covering language behavior, runtime mechanics, and practical patterns.",
    officialSite: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
    category: "Programming",
    level: "Beginner to Intermediate",
    concepts: [
      "variables",
      "scope",
      "closures",
      "hoisting",
      "promises",
      "async and await",
      "arrays",
      "objects",
      "modules",
      "event loop",
    ],
  },
  {
    title: "TypeScript Essentials",
    slug: "typescript-essentials",
    description:
      "TypeScript fundamentals, type safety, interfaces, generics, and advanced typing patterns.",
    officialSite: "https://www.typescriptlang.org/",
    category: "Programming",
    level: "Beginner to Advanced",
    concepts: [
      "type annotations",
      "interfaces",
      "type aliases",
      "generics",
      "union types",
      "intersection types",
      "utility types",
      "narrowing",
      "modules",
      "tsconfig",
    ],
  },
  {
    title: "React Essentials",
    slug: "react-essentials",
    description:
      "A practical path through React components, hooks, state management, and performance basics.",
    officialSite: "https://react.dev/",
    category: "Frontend",
    level: "Beginner to Advanced",
    concepts: [
      "components",
      "props",
      "state",
      "hooks",
      "rendering",
      "context",
      "effects",
      "forms",
      "memoization",
      "reconciliation",
    ],
  },
  {
    title: "Next.js Application Architecture",
    slug: "nextjs-application-architecture",
    description:
      "Routing, rendering, data fetching, and deployment patterns for production Next.js apps.",
    officialSite: "https://nextjs.org/",
    category: "Frontend",
    level: "Intermediate",
    concepts: [
      "file-based routing",
      "server components",
      "client components",
      "data fetching",
      "metadata",
      "API routes",
      "SSR",
      "SSG",
      "edge runtime",
      "deployment",
    ],
  },
  {
    title: "Node.js Backend Basics",
    slug: "nodejs-backend-basics",
    description:
      "Node.js runtime behavior, modules, async flow, and backend application patterns.",
    officialSite: "https://nodejs.org/",
    category: "Backend",
    level: "Beginner to Intermediate",
    concepts: [
      "runtime",
      "modules",
      "event loop",
      "filesystem",
      "streams",
      "buffer",
      "timers",
      "process",
      "environment variables",
      "packages",
    ],
  },
  {
    title: "Express API Development",
    slug: "express-api-development",
    description:
      "Routing, middleware, request validation, and error handling with Express.",
    officialSite: "https://expressjs.com/",
    category: "Backend",
    level: "Intermediate",
    concepts: [
      "routing",
      "middleware",
      "request lifecycle",
      "error handlers",
      "status codes",
      "params",
      "query strings",
      "body parsing",
      "auth middleware",
      "response shaping",
    ],
  },
  {
    title: "MongoDB Data Modeling",
    slug: "mongodb-data-modeling",
    description:
      "Document design, indexing, aggregation, and schema planning for MongoDB.",
    officialSite: "https://www.mongodb.com/",
    category: "Database",
    level: "Intermediate",
    concepts: [
      "documents",
      "collections",
      "indexes",
      "aggregation",
      "schema design",
      "embedding",
      "referencing",
      "queries",
      "transactions",
      "ObjectId",
    ],
  },
  {
    title: "SQL Database Foundations",
    slug: "sql-database-foundations",
    description:
      "Relational database concepts, joins, normalization, indexing, and query design.",
    officialSite: "https://www.postgresql.org/",
    category: "Database",
    level: "Beginner to Intermediate",
    concepts: [
      "tables",
      "primary keys",
      "foreign keys",
      "joins",
      "normalization",
      "indexes",
      "transactions",
      "constraints",
      "grouping",
      "subqueries",
    ],
  },
  {
    title: "HTML and CSS Mastery",
    slug: "html-css-mastery",
    description:
      "Semantic HTML and modern CSS layout, typography, and responsive design skills.",
    officialSite: "https://developer.mozilla.org/en-US/docs/Web/HTML",
    category: "Frontend",
    level: "Beginner",
    concepts: [
      "semantic HTML",
      "forms",
      "flexbox",
      "grid",
      "responsive design",
      "media queries",
      "accessibility",
      "typography",
      "positioning",
      "animations",
    ],
  },
  {
    title: "Git and GitHub Workflow",
    slug: "git-github-workflow",
    description:
      "Version control basics, collaboration workflows, branching, and release practices.",
    officialSite: "https://git-scm.com/",
    category: "Tools",
    level: "Beginner to Intermediate",
    concepts: [
      "commits",
      "branches",
      "merges",
      "rebase",
      "pull requests",
      "conflicts",
      "remote repositories",
      "stashing",
      "tagging",
      "history",
    ],
  },
  {
    title: "API Design Principles",
    slug: "api-design-principles",
    description:
      "REST conventions, resource modeling, versioning, pagination, and consistency.",
    officialSite: "https://restfulapi.net/",
    category: "Backend",
    level: "Intermediate",
    concepts: [
      "resources",
      "verbs",
      "status codes",
      "versioning",
      "pagination",
      "filtering",
      "sorting",
      "idempotency",
      "rate limiting",
      "error contracts",
    ],
  },
  {
    title: "Authentication and Authorization",
    slug: "authentication-and-authorization",
    description:
      "JWT, session concepts, OAuth flows, refresh tokens, and protected routes.",
    officialSite: "https://auth0.com/docs",
    category: "Security",
    level: "Intermediate to Advanced",
    concepts: [
      "JWT",
      "refresh tokens",
      "OAuth",
      "bearer auth",
      "token rotation",
      "claims",
      "scopes",
      "roles",
      "permissions",
      "protected routes",
    ],
  },
  {
    title: "Testing Web Apps",
    slug: "testing-web-apps",
    description:
      "Unit, integration, and end-to-end testing for modern web applications.",
    officialSite: "https://jestjs.io/",
    category: "Quality",
    level: "Intermediate",
    concepts: [
      "unit tests",
      "integration tests",
      "mocking",
      "assertions",
      "test coverage",
      "fixtures",
      "test doubles",
      "async tests",
      "snapshot testing",
      "e2e tests",
    ],
  },
  {
    title: "Security Basics for Developers",
    slug: "security-basics-for-developers",
    description:
      "Practical web security basics including input validation, secrets, and common threats.",
    officialSite: "https://owasp.org/",
    category: "Security",
    level: "Intermediate",
    concepts: [
      "input validation",
      "XSS",
      "CSRF",
      "SQL injection",
      "secret management",
      "password hashing",
      "least privilege",
      "rate limiting",
      "secure headers",
      "CORS",
    ],
  },
  {
    title: "DevOps Fundamentals",
    slug: "devops-fundamentals",
    description:
      "Deployment, observability, CI/CD, and infrastructure basics for developers.",
    officialSite: "https://www.redhat.com/en/topics/devops/what-is-devops",
    category: "DevOps",
    level: "Beginner to Intermediate",
    concepts: [
      "CI/CD",
      "containers",
      "logging",
      "monitoring",
      "deployment",
      "rollbacks",
      "infrastructure",
      "environment parity",
      "build pipelines",
      "release management",
    ],
  },
  {
    title: "Data Structures and Algorithms",
    slug: "data-structures-and-algorithms",
    description:
      "Core problem-solving concepts including arrays, trees, graphs, and complexity analysis.",
    officialSite: "https://cp-algorithms.com/",
    category: "Computer Science",
    level: "Intermediate to Advanced",
    concepts: [
      "arrays",
      "linked lists",
      "stacks",
      "queues",
      "trees",
      "graphs",
      "sorting",
      "searching",
      "dynamic programming",
      "big O",
    ],
  },
  {
    title: "Python Programming",
    slug: "python-programming",
    description:
      "Python syntax, data handling, functions, and practical programming patterns.",
    officialSite: "https://www.python.org/",
    category: "Programming",
    level: "Beginner to Intermediate",
    concepts: [
      "variables",
      "functions",
      "lists",
      "dictionaries",
      "classes",
      "modules",
      "exceptions",
      "file handling",
      "comprehensions",
      "packages",
    ],
  },
  {
    title: "Cloud Computing Basics",
    slug: "cloud-computing-basics",
    description:
      "Cloud service models, scaling, storage, deployment, and managed services.",
    officialSite: "https://aws.amazon.com/what-is-cloud-computing/",
    category: "Cloud",
    level: "Beginner to Intermediate",
    concepts: [
      "IaaS",
      "PaaS",
      "SaaS",
      "scaling",
      "storage",
      "compute",
      "availability",
      "region",
      "load balancing",
      "managed services",
    ],
  },
  {
    title: "System Design Essentials",
    slug: "system-design-essentials",
    description:
      "Scalability, caching, queues, databases, and architecture tradeoffs.",
    officialSite: "https://martinfowler.com/",
    category: "Architecture",
    level: "Advanced",
    concepts: [
      "scalability",
      "caching",
      "queues",
      "load balancing",
      "replication",
      "sharding",
      "consistency",
      "throughput",
      "latency",
      "tradeoffs",
    ],
  },
];

function createQuestions(prefix, concepts, answerLabel) {
  const questions = [];

  for (let i = 0; i < 50; i += 1) {
    const concept = concepts[i % concepts.length];
    const difficulty = i < 15 ? "easy" : i < 35 ? "medium" : "hard";
    const baseOptions = [
      `${concept} best practice`,
      `${concept} incorrect choice`,
      `${concept} alternative`,
      `${concept} edge case`,
    ];
    const options = rotate(baseOptions, i);

    questions.push({
      id: `q_${i + 1}`,
      prompt: `${prefix}: Which option best describes ${concept}?`,
      options,
      correctOptionIndex: options.indexOf(baseOptions[0]),
      explanation: `${answerLabel} for ${concept}.`,
      difficulty,
    });
  }

  return questions;
}

function rotate(items, seed) {
  const shift = seed % items.length;
  return items.slice(shift).concat(items.slice(0, shift));
}

function buildCourse(spec) {
  return {
    title: spec.title,
    slug: spec.slug,
    description: spec.description,
    officialSite: spec.officialSite,
    category: spec.category,
    level: spec.level,
    quiz: {
      passScorePercent: 90,
      questions: createQuestions(spec.title, spec.concepts, `The correct answer explains ${spec.title.toLowerCase()}`),
    },
  };
}

function main() {
  const catalog = courseSpecs.map(buildCourse);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(catalog, null, 2), "utf8");
  console.log(`Wrote ${catalog.length} courses to ${outputPath}`);
}

main();
