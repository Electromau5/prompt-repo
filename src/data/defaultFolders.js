// Default folder structure for Prompt Repository
export const defaultFolders = [
  // Writing
  { id: 'writing', name: 'Writing', parentId: null },

  // Coding
  { id: 'coding', name: 'Coding', parentId: null },
  { id: 'coding-debug', name: 'Debug', parentId: 'coding' },
  { id: 'coding-ui-magic', name: 'UI Components - Magic MCP', parentId: 'coding' },
  { id: 'coding-frontend', name: 'Frontend Code', parentId: 'coding' },
  { id: 'coding-backend', name: 'Backend Code', parentId: 'coding' },

  // Project Strategy
  { id: 'project-strategy', name: 'Project Strategy', parentId: null },
  { id: 'project-mvp', name: 'MVP - Token Manager', parentId: 'project-strategy' },

  // Design
  { id: 'design', name: 'Design', parentId: null },
  { id: 'design-website', name: 'Website Design', parentId: 'design' },
  { id: 'design-systems', name: 'Design Systems', parentId: 'design' },
  { id: 'design-chatbot-ds', name: 'Chatbot DS Features', parentId: 'design-systems' },
  { id: 'design-components', name: 'Components', parentId: 'design-systems' },
  { id: 'design-documentation', name: 'Documentation', parentId: 'design-systems' },
  { id: 'design-zeroheight', name: 'ZeroHeight', parentId: 'design-documentation' },
  { id: 'design-prototyping', name: 'Prototyping', parentId: 'design' },
  { id: 'design-figma', name: 'Figma', parentId: 'design-prototyping' },
  { id: 'design-user-research', name: 'User Research', parentId: 'design' },
  { id: 'design-ux-artifacts', name: 'UX Artifacts', parentId: 'design' },
  { id: 'design-journey-maps', name: 'User Journey Maps', parentId: 'design-ux-artifacts' },

  // Agents
  { id: 'agents', name: 'Agents', parentId: null },
  { id: 'agents-notion', name: 'Notion Workflow', parentId: 'agents' },
  { id: 'agents-cowork', name: 'Cowork', parentId: 'agents' },
  { id: 'agents-zapier', name: 'Zapier', parentId: 'agents' },

  // Financial
  { id: 'financial', name: 'Financial', parentId: null },
  { id: 'financial-crypto', name: 'Crypto Workflow', parentId: 'financial' },
  { id: 'financial-subscriptions', name: 'Subscriptions', parentId: 'financial' },

  // Events
  { id: 'events', name: 'Events', parentId: null },
  { id: 'events-luma', name: 'Luma Workflow', parentId: 'events' },
  { id: 'events-eventbrite', name: 'Eventbrite Workflow', parentId: 'events' },

  // Growth Hacking
  { id: 'growth-hacking', name: 'Growth Hacking', parentId: null },
  { id: 'growth-presentations', name: 'Presentations', parentId: 'growth-hacking' },
  { id: 'growth-ingestion', name: 'Ingestion Pipeline', parentId: 'growth-hacking' },
  { id: 'growth-publication', name: 'Publication Pipeline', parentId: 'growth-hacking' },
  { id: 'growth-x', name: 'X', parentId: 'growth-publication' },

  // Funding
  { id: 'funding', name: 'Funding', parentId: null },
  { id: 'funding-presentations', name: 'Presentations', parentId: 'funding' },

  // Lifestyle
  { id: 'lifestyle', name: 'Lifestyle', parentId: null },
  { id: 'lifestyle-tattoos', name: 'Tattoos', parentId: 'lifestyle' },

  // Databases
  { id: 'databases', name: 'Databases', parentId: null },
  { id: 'databases-producthunt', name: 'Product Hunt', parentId: 'databases' },
  { id: 'databases-appsumo', name: 'AppSumo', parentId: 'databases' },
];

export const defaultData = {
  folders: defaultFolders,
  prompts: [],
  tags: [],
  tagCategories: []
};
