/**
 * Industry Categories and Buyer Personas
 * Synthesized from 2024–2025 market intelligence reports
 * (Deloitte, McKinsey, Euromonitor, WGSN, etc.)
 */

export interface BuyerPersona {
  id: string;
  name: string;
  description?: string;
}

export interface IndustryCategory {
  id: string;
  name: string;
  subcategories?: {
    id: string;
    name: string;
    personas: BuyerPersona[];
  }[];
  personas?: BuyerPersona[]; // For categories without subcategories
}

export const INDUSTRY_CATEGORIES: IndustryCategory[] = [
  {
    id: "technology",
    name: "Technology & Digital Infrastructure",
    subcategories: [
      {
        id: "enterprise-saas",
        name: "Enterprise SaaS & Cloud",
        personas: [
          { id: "cio", name: "CIO" },
          { id: "cto", name: "Chief Technical Officer" },
          { id: "ciso", name: "CISO" },
          { id: "devops-engineer", name: "DevOps Engineer" },
          { id: "solutions-architect", name: "Solutions Architect" },
          { id: "it-procurement", name: "IT Procurement Manager" },
          { id: "ai-decision-maker", name: "The AI-Augmented Decision Maker" },
          { id: "revops-lead", name: "Revenue Operations Lead" },
        ],
      },
      {
        id: "cybersecurity",
        name: "Cybersecurity",
        personas: [
          { id: "ciso-cyber", name: "Chief Information Security Officer" },
          { id: "soc-manager", name: "SOC Manager" },
          { id: "risk-compliance", name: "Risk Compliance Officer" },
          { id: "ethical-hacker", name: "Ethical Hacker" },
          { id: "data-privacy", name: "Data Privacy Officer" },
          { id: "network-security", name: "Network Security Engineer" },
        ],
      },
      {
        id: "consumer-electronics",
        name: "Consumer Electronics",
        personas: [
          { id: "curator-creator", name: "The Curator/Creator" },
          { id: "anti-norm", name: "The Anti-Norm/Tech Realist" },
          { id: "connected-shopper-tech", name: "The Connected Shopper" },
          { id: "early-adopter", name: "The Early Adopter" },
          { id: "privacy-advocate", name: "The Privacy Advocate" },
          { id: "smart-home-integrator", name: "The Smart Home Integrator" },
        ],
      },
      {
        id: "telecommunications",
        name: "Telecommunications",
        personas: [
          { id: "network-architect", name: "Network Architect" },
          { id: "infrastructure-manager", name: "Infrastructure Manager" },
          { id: "telecom-procurement", name: "Telecom Procurement Manager" },
          { id: "data-streamer", name: "The Data-Hungry Streamer" },
          { id: "bundle-seeker", name: "The Bundle Seeker" },
          { id: "5g-adopter", name: "The 5G Enterprise Adopter" },
        ],
      },
      {
        id: "artificial-intelligence",
        name: "Artificial Intelligence",
        personas: [
          { id: "chief-data-officer", name: "Chief Data Officer" },
          { id: "head-ai-strategy", name: "Head of AI Strategy" },
          { id: "data-scientist", name: "Data Scientist" },
          { id: "mlops-engineer", name: "MLOps Engineer" },
          { id: "ai-tech-buyer", name: "The AI-Savvy Tech Buyer" },
          { id: "automation-lead", name: "Automation Lead" },
        ],
      },
    ],
  },
  {
    id: "retail-consumer",
    name: "Retail & Consumer Goods",
    subcategories: [
      {
        id: "fashion-apparel",
        name: "Fashion & Apparel",
        personas: [
          { id: "circular-economist", name: "The Circular Economist/Resaler" },
          { id: "aspirational-pullback", name: "The Aspirational Pullback" },
          { id: "heirloom-investor", name: "The Heirloom Investor" },
          { id: "trendsetter", name: "The Trendsetter" },
          { id: "sustainable-changemaker", name: "The Sustainable Changemaker" },
          { id: "algorithm-style", name: "The Algorithm-Driven Style Seeker" },
        ],
      },
      {
        id: "beauty-personal-care",
        name: "Beauty & Personal Care",
        personas: [
          { id: "skintellectual", name: "The Skintellectual 2.0" },
          { id: "pro-aging", name: "The Pro-Aging Advocate" },
          { id: "hybrid-minimalist", name: "The Hybrid Minimalist" },
          { id: "science-backer", name: "The Science-Backer" },
          { id: "clean-beauty", name: "The Clean Beauty Purist" },
          { id: "diy-treatment", name: "The DIY Treatment User" },
        ],
      },
      {
        id: "food-beverage",
        name: "Food & Beverage",
        personas: [
          { id: "glp1-adapter", name: "The GLP-1 Adapter" },
          { id: "mood-manager", name: "The Mood Manager/Functional Eater" },
          { id: "sober-curious", name: "The Sober-Curious Socializer" },
          { id: "ingredient-purist", name: "The Ingredient Purist" },
          { id: "little-treat", name: "The Little Treat Seeker" },
          { id: "value-budgeteer", name: "The Value-Conscious Budgeteer" },
        ],
      },
      {
        id: "general-retail",
        name: "General Retail/E-commerce",
        personas: [
          { id: "connected-shopper", name: "The Connected Shopper" },
          { id: "budgeteer", name: "The Budgeteer" },
          { id: "experience-seeker-retail", name: "The Experience Seeker" },
          { id: "brand-champion", name: "The Brand Champion" },
          { id: "impulse-buyer", name: "The Impulse Buyer" },
          { id: "omni-channel", name: "The Omni-Channel Loyalist" },
        ],
      },
      {
        id: "luxury-goods",
        name: "Luxury Goods",
        personas: [
          { id: "henry", name: "The Henry (High-Earner-Not-Rich-Yet)" },
          { id: "quiet-luxury", name: "The Quiet Luxury Connoisseur" },
          { id: "veblen-consumer", name: "The Veblen Consumer" },
          { id: "investment-collector", name: "The Investment Collector" },
          { id: "exclusivity-seeker", name: "The Exclusivity Seeker" },
        ],
      },
    ],
  },
  {
    id: "healthcare",
    name: "Healthcare & Life Sciences",
    subcategories: [
      {
        id: "pharma-biotech",
        name: "Pharmaceuticals & Biotech",
        personas: [
          { id: "clinical-trial-manager", name: "Clinical Trial Manager" },
          { id: "rd-director", name: "R&D Director" },
          { id: "lab-manager", name: "Lab Manager" },
          { id: "regulatory-affairs", name: "Regulatory Affairs Director" },
          { id: "medical-science-liaison", name: "Medical Science Liaison" },
          { id: "chronic-condition", name: "The Chronic Condition Manager" },
        ],
      },
      {
        id: "medical-devices",
        name: "Medical Devices",
        personas: [
          { id: "vac-member", name: "Value Analysis Committee Member" },
          { id: "cmo", name: "Chief Medical Officer" },
          { id: "biomed-engineer", name: "Bio-med Engineer" },
          { id: "surgical-head", name: "Surgical Department Head" },
          { id: "hospital-procurement", name: "Hospital Procurement Director" },
        ],
      },
      {
        id: "healthcare-providers",
        name: "Healthcare Providers/Services",
        personas: [
          { id: "wellness-enthusiast", name: "The Wellness Enthusiast" },
          { id: "self-quantifier", name: "The Self-Quantifier" },
          { id: "telehealth-native", name: "The Telehealth Native" },
          { id: "holistic-health", name: "The Holistic Health Seeker" },
          { id: "value-based-patient", name: "The Value-Based Patient" },
          { id: "caregiver", name: "The Caregiver" },
        ],
      },
      {
        id: "fitness-wellness",
        name: "Fitness & Wellness",
        personas: [
          { id: "hybrid-fitness", name: "The Hybrid Fitness User" },
          { id: "at-home-streamer", name: "The At-Home Streamer" },
          { id: "strength-training", name: "The Strength Training Devotee" },
          { id: "recovery-biohacker", name: "The Recovery/Biohacker" },
          { id: "community-gym", name: "The Community Gym-Goer" },
        ],
      },
    ],
  },
  {
    id: "financial-services",
    name: "Financial Services",
    subcategories: [
      {
        id: "banking-fintech",
        name: "Banking & Fintech",
        personas: [
          { id: "digital-investor", name: "The Digital Native Investor" },
          { id: "cfo", name: "The Chief Financial Officer" },
          { id: "treasury-manager", name: "The Treasury Manager" },
          { id: "crypto-curious", name: "The Crypto-Curious Pragmatist" },
          { id: "financial-wellness", name: "The Financial Wellness Seeker" },
          { id: "hnw-individual", name: "The High Net Worth Individual" },
        ],
      },
      {
        id: "insurance",
        name: "Insurance",
        personas: [
          { id: "risk-manager", name: "The Risk Manager" },
          { id: "independent-broker", name: "The Independent Broker/Agent" },
          { id: "underwriter", name: "The Underwriter" },
          { id: "usage-based", name: "The Usage-Based Policyholder" },
          { id: "climate-conscious", name: "The Climate-Conscious Insured" },
          { id: "price-switcher", name: "The Price-Sensitive Switcher" },
        ],
      },
      {
        id: "wealth-management",
        name: "Wealth Management",
        personas: [
          { id: "portfolio-manager", name: "The Portfolio Manager" },
          { id: "esg-investor", name: "The ESG Investor" },
          { id: "next-gen-heir", name: "The Next-Gen Heir" },
          { id: "retirement-planner", name: "The Retirement Planner" },
          { id: "self-directed-trader", name: "The Self-Directed Trader" },
        ],
      },
    ],
  },
  {
    id: "industrial",
    name: "Industrial & Manufacturing",
    subcategories: [
      {
        id: "automotive",
        name: "Automotive Manufacturing",
        personas: [
          { id: "plant-manager", name: "Plant Manager" },
          { id: "procurement-officer", name: "Procurement Officer" },
          { id: "design-engineer", name: "Design Engineer" },
          { id: "qc-manager", name: "Quality Control Manager" },
          { id: "ev-skeptic", name: "The EV Skeptic" },
          { id: "sdv-architect", name: "The Software-Defined Vehicle Architect" },
        ],
      },
      {
        id: "chemical",
        name: "Chemical Industry",
        personas: [
          { id: "rd-chemist", name: "R&D Chemist" },
          { id: "process-engineer", name: "Process Engineer" },
          { id: "ehs-manager", name: "EHS Manager" },
          { id: "regulatory-specialist", name: "Regulatory Affairs Specialist" },
          { id: "product-steward", name: "Product Steward" },
          { id: "procurement-chem", name: "Procurement Manager" },
        ],
      },
      {
        id: "aerospace-defense",
        name: "Aerospace & Defense",
        personas: [
          { id: "program-manager", name: "Program Manager" },
          { id: "systems-engineer", name: "Systems Engineer" },
          { id: "government-liaison", name: "Government Liaison" },
          { id: "compliance-officer", name: "Compliance Officer" },
          { id: "mro-director", name: "Maintenance Director/MRO" },
        ],
      },
      {
        id: "logistics",
        name: "Logistics & Supply Chain",
        personas: [
          { id: "fleet-manager", name: "Fleet Manager" },
          { id: "supply-chain-vp", name: "Supply Chain VP" },
          { id: "logistics-director", name: "Logistics Director" },
          { id: "warehouse-ops", name: "Warehouse Operations Manager" },
          { id: "last-mile", name: "The Last-Mile Coordinator" },
        ],
      },
    ],
  },
  {
    id: "energy",
    name: "Energy & Utilities",
    subcategories: [
      {
        id: "renewable-energy",
        name: "Renewable Energy",
        personas: [
          { id: "sustainability-director", name: "Sustainability Director" },
          { id: "solar-installer", name: "Solar Installer" },
          { id: "project-developer", name: "Project Developer" },
          { id: "green-prosumer", name: "The Green Prosumer" },
          { id: "energy-independence", name: "The Energy Independence Seeker" },
          { id: "grid-planner", name: "The Grid Planner" },
        ],
      },
      {
        id: "oil-gas",
        name: "Oil & Gas",
        personas: [
          { id: "drilling-engineer", name: "Drilling Engineer" },
          { id: "exploration-manager", name: "Exploration Manager" },
          { id: "refinery-ops", name: "Refinery Operations Manager" },
          { id: "hse-manager", name: "HSE Manager" },
          { id: "asset-manager", name: "Asset Manager" },
        ],
      },
      {
        id: "utilities",
        name: "Utilities (Water/Electric)",
        personas: [
          { id: "cost-ratepayer", name: "The Cost-Conscious Ratepayer" },
          { id: "smart-meter", name: "The Smart Meter Adopter" },
          { id: "municipal-buyer", name: "The Municipal Buyer" },
          { id: "infrastructure-eng", name: "The Infrastructure Engineer" },
        ],
      },
    ],
  },
  {
    id: "real-estate",
    name: "Real Estate & Construction",
    subcategories: [
      {
        id: "residential",
        name: "Residential Real Estate",
        personas: [
          { id: "first-time-buyer", name: "The First-Time Homebuyer" },
          { id: "house-hacker", name: "The House Hacker" },
          { id: "suburban-migrator", name: "The Suburban Migrator" },
          { id: "climate-resilient", name: "The Climate-Resilient Buyer" },
          { id: "downsizing-boomer", name: "The Downsizing Boomer" },
          { id: "luxury-lifestyle", name: "The Luxury Lifestyle Investor" },
        ],
      },
      {
        id: "commercial",
        name: "Commercial Real Estate",
        personas: [
          { id: "property-manager", name: "The Commercial Property Manager" },
          { id: "tenant-experience", name: "The Tenant Experience Manager" },
          { id: "institutional-investor", name: "The Institutional Investor" },
          { id: "facilities-manager", name: "The Facilities Manager" },
        ],
      },
      {
        id: "construction",
        name: "Construction",
        personas: [
          { id: "general-contractor", name: "General Contractor" },
          { id: "architect-specifier", name: "Architect/Specifier" },
          { id: "project-manager-const", name: "Project Manager" },
          { id: "site-superintendent", name: "Site Superintendent" },
          { id: "green-building", name: "The Green Building Certifier/LEED AP" },
        ],
      },
    ],
  },
  {
    id: "travel-hospitality",
    name: "Travel & Hospitality",
    subcategories: [
      {
        id: "hotels",
        name: "Hotels & Lodging",
        personas: [
          { id: "sleep-tourist", name: "The Sleep Tourist" },
          { id: "bleisure-nomad", name: "The Bleisure Nomad" },
          { id: "eco-immerser", name: "The Eco-Immerser" },
          { id: "hotel-gm", name: "The Hotel General Manager" },
          { id: "revenue-manager", name: "The Revenue Manager" },
        ],
      },
      {
        id: "travel-tourism",
        name: "Travel & Tourism",
        personas: [
          { id: "experience-hunter", name: "The Experience Hunter" },
          { id: "solo-traveler", name: "The Solo Traveler" },
          { id: "multi-gen-family", name: "The Multi-Generational Family Planner" },
          { id: "sports-nomad", name: "The Sports/Event Nomad" },
          { id: "wellness-retreat", name: "The Wellness Retreat Goer" },
        ],
      },
    ],
  },
  {
    id: "education",
    name: "Education",
    subcategories: [
      {
        id: "higher-ed",
        name: "Higher Education",
        personas: [
          { id: "roi-pragmatist", name: "The ROI Pragmatist" },
          { id: "experience-hunter-edu", name: "The Experience Hunter" },
          { id: "non-traditional", name: "The Non-Traditional Learner" },
          { id: "dean-provost", name: "University Dean/Provost" },
          { id: "research-admin", name: "Research Grant Administrator" },
        ],
      },
      {
        id: "k12-edtech",
        name: "K-12 & EdTech",
        personas: [
          { id: "superintendent", name: "The District Superintendent" },
          { id: "curriculum-director", name: "The Curriculum Director" },
          { id: "school-principal", name: "The School Principal" },
          { id: "special-ed", name: "The Special Education Coordinator" },
          { id: "it-director-edu", name: "The IT Director" },
          { id: "engaged-parent", name: "The Engaged Parent" },
        ],
      },
    ],
  },
  {
    id: "media-entertainment",
    name: "Media & Entertainment",
    subcategories: [
      {
        id: "streaming",
        name: "Streaming & Content",
        personas: [
          { id: "binge-watcher", name: "The Binge Watcher" },
          { id: "niche-subscriber", name: "The Niche Subscriber" },
          { id: "cord-cutter", name: "The Cord-Cutter" },
          { id: "ad-tolerant", name: "The Ad-Tolerant Viewer" },
          { id: "social-video", name: "The Social Video Consumer" },
        ],
      },
      {
        id: "gaming",
        name: "Gaming",
        personas: [
          { id: "competitive-gamer", name: "The Competitive Gamer/Esports Aspirant" },
          { id: "cozy-gamer", name: "The Cozy Gamer" },
          { id: "social-gamer", name: "The Social Gamer" },
          { id: "hardware-enthusiast", name: "The Hardware Enthusiast" },
          { id: "cross-platform", name: "The Cross-Platform Player" },
        ],
      },
    ],
  },
  {
    id: "professional-services",
    name: "Professional Services",
    subcategories: [
      {
        id: "hr-staffing",
        name: "Human Resources & Staffing",
        personas: [
          { id: "talent-acquisition", name: "The Talent Acquisition Manager" },
          { id: "chro", name: "The CHRO" },
          { id: "benefits-admin", name: "The Benefits Administrator" },
          { id: "passive-candidate", name: "The Passive Candidate" },
          { id: "gig-worker", name: "The Gig Worker/Freelancer" },
        ],
      },
      {
        id: "legal",
        name: "Legal Services",
        personas: [
          { id: "general-counsel", name: "The General Counsel" },
          { id: "managing-partner", name: "The Managing Partner" },
          { id: "legal-ops", name: "The Legal Operations Manager" },
          { id: "ediscovery", name: "The E-Discovery Specialist" },
        ],
      },
      {
        id: "marketing-agencies",
        name: "Marketing Agencies",
        personas: [
          { id: "cmo", name: "The Chief Marketing Officer" },
          { id: "brand-manager", name: "The Brand Manager" },
          { id: "media-buyer", name: "The Media Buyer" },
          { id: "content-strategist", name: "The Content Strategist" },
          { id: "social-media-manager", name: "The Social Media Manager" },
        ],
      },
    ],
  },
  {
    id: "agriculture-pets",
    name: "Agriculture & Pets",
    subcategories: [
      {
        id: "agriculture",
        name: "Agriculture/AgTech",
        personas: [
          { id: "roi-farmer", name: "The ROI-Focused Farmer" },
          { id: "regenerative-grower", name: "The Regenerative/Sustainable Grower" },
          { id: "agtech-adopter", name: "The AgTech Early Adopter" },
          { id: "farm-manager", name: "The Farm Manager" },
          { id: "agronomist", name: "The Agronomist" },
        ],
      },
      {
        id: "pet-industry",
        name: "Pet Industry",
        personas: [
          { id: "multi-pet-genz", name: "The Multi-Pet Gen Z" },
          { id: "functional-feeder", name: "The Functional Feeder" },
          { id: "fur-baby-parent", name: "The Fur-Baby Parent" },
          { id: "pet-health", name: "The Pet Health Optimizer" },
          { id: "tech-pet-owner", name: "The Tech-Enabled Pet Owner" },
        ],
      },
    ],
  },
  {
    id: "public-nonprofit",
    name: "Public & Non-Profit",
    subcategories: [
      {
        id: "government",
        name: "Government",
        personas: [
          { id: "procurement-gov", name: "The Procurement Officer" },
          { id: "agency-director", name: "The Agency Director" },
          { id: "policy-advisor", name: "The Policy Advisor" },
          { id: "city-manager", name: "The City Manager" },
          { id: "public-works", name: "The Public Works Director" },
        ],
      },
      {
        id: "nonprofit",
        name: "Non-Profit",
        personas: [
          { id: "development-director", name: "The Development Director" },
          { id: "grant-manager", name: "The Grant Manager" },
          { id: "recurring-donor", name: "The Recurring Donor" },
          { id: "major-donor", name: "The Major Donor" },
          { id: "volunteer-coordinator", name: "The Volunteer Coordinator" },
        ],
      },
    ],
  },
];

/**
 * Get all personas for a given industry category
 */
export function getPersonasForCategory(categoryId: string): BuyerPersona[] {
  const category = INDUSTRY_CATEGORIES.find(c => c.id === categoryId);
  if (!category) return [];
  
  if (category.personas) {
    return category.personas;
  }
  
  if (category.subcategories) {
    return category.subcategories.flatMap(sub => sub.personas);
  }
  
  return [];
}

/**
 * Get personas for a specific subcategory
 */
export function getPersonasForSubcategory(categoryId: string, subcategoryId: string): BuyerPersona[] {
  const category = INDUSTRY_CATEGORIES.find(c => c.id === categoryId);
  if (!category?.subcategories) return [];
  
  const subcategory = category.subcategories.find(s => s.id === subcategoryId);
  return subcategory?.personas || [];
}

/**
 * Get a flattened list of all categories/subcategories for dropdown
 */
export function getFlatCategoryList(): { id: string; name: string; parentId?: string }[] {
  const result: { id: string; name: string; parentId?: string }[] = [];
  
  for (const category of INDUSTRY_CATEGORIES) {
    if (category.subcategories) {
      for (const sub of category.subcategories) {
        result.push({
          id: `${category.id}/${sub.id}`,
          name: `${category.name} > ${sub.name}`,
          parentId: category.id,
        });
      }
    } else {
      result.push({
        id: category.id,
        name: category.name,
      });
    }
  }
  
  return result;
}
