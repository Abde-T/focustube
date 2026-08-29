/**
 * Semantic Topic Profiles
 * 
 * Rich natural language descriptions for each topic to improve
 * embedding-based semantic similarity matching.
 * 
 * Each profile contains multiple semantic prototypes that capture
 * different aspects of the topic's meaning.
 */

export interface SemanticProfile {
  topic: string;
  prototypes: string[];
}

export const SEMANTIC_PROFILES: Record<string, SemanticProfile> = {
  'software engineering': {
    topic: 'software engineering',
    prototypes: [
      'software engineering and software development practices',
      'programming and writing computer code',
      'coding tutorials for developers and engineers',
      'frontend and backend web development',
      'web application development and frameworks',
      'software architecture and system design',
      'APIs and database design',
      'debugging testing and developer tools',
      'programming languages and language features',
      'technical programming tutorials and best practices',
      'software development lifecycle and methodologies',
      'version control and collaboration tools',
      'cloud computing and deployment',
      'microservices and distributed systems',
      'software performance optimization',
    ]
  },

  'programming': {
    topic: 'programming',
    prototypes: [
      'computer programming and coding',
      'writing and understanding source code',
      'coding tutorials and programming lessons',
      'learning programming languages',
      'algorithms and data structures',
      'solving programming problems',
      'software development techniques',
      'programming concepts and paradigms',
      'code optimization and refactoring',
      'programming best practices',
      'full stack development and fullstack programming',
      'frontend and backend programming',
      'web development and application programming',
      'programming tutorials for beginners and advanced',
      'software engineering and coding',
      'programming languages like javascript python java typescript',
      'frameworks and libraries for programming',
      'API development and backend programming',
      'database programming and SQL',
      'mobile app development and programming',
      'system programming and low level coding',
    ]
  },

  'web development': {
    topic: 'web development',
    prototypes: [
      'web development and website creation',
      'HTML CSS and JavaScript',
      'frontend web development',
      'backend web development',
      'full stack web development',
      'web frameworks and libraries',
      'responsive web design',
      'web application development',
      'web APIs and services',
      'web performance optimization',
      'web development tools',
      'modern web technologies',
    ]
  },

  'mobile development': {
    topic: 'mobile development',
    prototypes: [
      'mobile app development',
      'iOS development with Swift',
      'Android development',
      'cross platform mobile development',
      'React Native and Flutter',
      'mobile UI design',
      'mobile app architecture',
      'mobile development tools',
      'app store deployment',
      'mobile performance optimization',
    ]
  },

  'data science': {
    topic: 'data science',
    prototypes: [
      'data science and data analysis',
      'statistical analysis and modeling',
      'data visualization',
      'machine learning for data science',
      'big data processing',
      'data mining and exploration',
      'predictive analytics',
      'data wrangling and cleaning',
      'data science tools and libraries',
      'data driven decision making',
    ]
  },

  'machine learning': {
    topic: 'machine learning',
    prototypes: [
      'machine learning algorithms and models',
      'deep learning and neural networks',
      'supervised and unsupervised learning',
      'natural language processing',
      'computer vision',
      'ML model training and evaluation',
      'feature engineering',
      'ML frameworks and tools',
      'model deployment and serving',
      'machine learning best practices',
    ]
  },

  'artificial intelligence': {
    topic: 'artificial intelligence',
    prototypes: [
      'artificial intelligence and AI systems',
      'AI applications and use cases',
      'generative AI and large language models',
      'AI ethics and safety',
      'AI research and development',
      'intelligent systems',
      'AI automation and robotics',
      'AI tools and platforms',
      'future of artificial intelligence',
    ]
  },

  'cybersecurity': {
    topic: 'cybersecurity',
    prototypes: [
      'cybersecurity and information security',
      'network security and protection',
      'ethical hacking and penetration testing',
      'security best practices',
      'malware analysis and prevention',
      'security tools and technologies',
      'data encryption and privacy',
      'security compliance and standards',
      'incident response',
      'security awareness',
    ]
  },

  'devops': {
    topic: 'devops',
    prototypes: [
      'DevOps and development operations',
      'continuous integration and deployment',
      'containerization with Docker',
      'Kubernetes and orchestration',
      'infrastructure as code',
      'cloud infrastructure management',
      'monitoring and logging',
      'automation and scripting',
      'DevOps tools and practices',
      'site reliability engineering',
    ]
  },

  'cloud computing': {
    topic: 'cloud computing',
    prototypes: [
      'cloud computing and cloud services',
      'AWS Amazon Web Services',
      'Google Cloud Platform',
      'Microsoft Azure',
      'cloud architecture and design',
      'serverless computing',
      'cloud security',
      'cloud cost optimization',
      'multi cloud strategies',
      'cloud migration',
    ]
  },

  'entrepreneurship': {
    topic: 'entrepreneurship',
    prototypes: [
      'starting and building businesses',
      'startups and entrepreneurship',
      'launching products and services',
      'business strategy and planning',
      'SaaS businesses and software products',
      'founders and startup case studies',
      'growing a company',
      'business development',
      'entrepreneurial mindset',
      'business funding and investment',
      'product market fit',
      'scaling a business',
    ]
  },

  'business': {
    topic: 'business',
    prototypes: [
      'business management and operations',
      'corporate strategy',
      'business analysis',
      'organizational behavior',
      'business processes',
      'business communication',
      'professional development',
      'career growth in business',
      'business ethics',
      'business innovation',
    ]
  },

  'marketing': {
    topic: 'marketing',
    prototypes: [
      'digital marketing strategies',
      'content marketing',
      'social media marketing',
      'SEO and search engine optimization',
      'email marketing',
      'marketing analytics',
      'brand marketing',
      'growth marketing',
      'marketing automation',
      'marketing campaigns',
    ]
  },

  'sales': {
    topic: 'sales',
    prototypes: [
      'sales techniques and strategies',
      'B2B sales and business development',
      'sales training',
      'closing deals',
      'sales psychology',
      'customer relationship management',
      'sales automation',
      'negotiation skills',
      'sales leadership',
      'sales performance',
    ]
  },

  'finance': {
    topic: 'finance',
    prototypes: [
      'corporate finance',
      'financial analysis',
      'financial planning',
      'financial markets',
      'banking and financial services',
      'financial modeling',
      'risk management',
      'financial reporting',
      'business finance',
      'financial strategy',
    ]
  },

  'investing': {
    topic: 'investing',
    prototypes: [
      'investment strategies',
      'stock market investing',
      'value investing',
      'index funds and ETFs',
      'real estate investing',
      'investment analysis',
      'portfolio management',
      'investment risk management',
      'passive investing',
      'investment education',
    ]
  },

  'personal finance': {
    topic: 'personal finance',
    prototypes: [
      'personal finance management',
      'budgeting and saving',
      'debt management',
      'retirement planning',
      'financial independence',
      'money management',
      'personal investing',
      'financial literacy',
      'savings strategies',
      'financial goals',
    ]
  },

  'economics': {
    topic: 'economics',
    prototypes: [
      'economics and economic theory',
      'microeconomics',
      'macroeconomics',
      'economic policy',
      'market economics',
      'economic analysis',
      'economic history',
      'behavioral economics',
      'international economics',
      'economic trends',
    ]
  },

  'science': {
    topic: 'science',
    prototypes: [
      'scientific research and discovery',
      'scientific method',
      'laboratory experiments',
      'scientific education',
      'scientific breakthroughs',
      'science communication',
      'popular science',
      'scientific literacy',
      'research methodology',
      'science and technology',
    ]
  },

  'physics': {
    topic: 'physics',
    prototypes: [
      'physics and physical science',
      'classical mechanics',
      'quantum physics',
      'thermodynamics',
      'electromagnetism',
      'particle physics',
      'astrophysics',
      'physics experiments',
      'theoretical physics',
      'applied physics',
    ]
  },

  'chemistry': {
    topic: 'chemistry',
    prototypes: [
      'chemistry and chemical science',
      'organic chemistry',
      'inorganic chemistry',
      'biochemistry',
      'chemical reactions',
      'laboratory chemistry',
      'chemical analysis',
      'molecular chemistry',
      'chemical engineering',
      'chemistry education',
    ]
  },

  'biology': {
    topic: 'biology',
    prototypes: [
      'biology and life sciences',
      'molecular biology',
      'cell biology',
      'genetics',
      'evolutionary biology',
      'ecology',
      'microbiology',
      'biological research',
      'biological systems',
      'biology education',
    ]
  },

  'astronomy': {
    topic: 'astronomy',
    prototypes: [
      'astronomy and space science',
      'planetary science',
      'stellar astronomy',
      'galactic astronomy',
      'cosmology',
      'space exploration',
      'astronomical observation',
      'astrophysics',
      'space telescopes',
      'astronomy education',
    ]
  },

  'environmental science': {
    topic: 'environmental science',
    prototypes: [
      'environmental science and ecology',
      'climate change',
      'environmental protection',
      'sustainability',
      'conservation',
      'environmental policy',
      'ecosystems',
      'environmental research',
      'green technology',
      'environmental education',
    ]
  },

  'history': {
    topic: 'history',
    prototypes: [
      'historical events and periods',
      'historical analysis',
      'historical research',
      'world history',
      'historical documentation',
      'historical interpretation',
      'historical education',
      'historical narratives',
      'historical context',
      'historical significance',
    ]
  },

  'mathematics': {
    topic: 'mathematics',
    prototypes: [
      'mathematics and mathematical science',
      'algebra and equations',
      'calculus and analysis',
      'geometry and topology',
      'statistics and probability',
      'number theory',
      'mathematical proofs',
      'applied mathematics',
      'mathematical modeling',
      'mathematics education',
    ]
  },

  'language learning': {
    topic: 'language learning',
    prototypes: [
      'learning new languages',
      'language acquisition',
      'foreign language study',
      'language fluency',
      'language education',
      'language practice',
      'multilingualism',
      'language skills',
      'language learning methods',
      'language immersion',
    ]
  },

  'productivity': {
    topic: 'productivity',
    prototypes: [
      'productivity and efficiency',
      'time management',
      'focus and concentration',
      'work optimization',
      'productivity tools',
      'productivity systems',
      'getting things done',
      'work habits',
      'productivity techniques',
      'personal productivity',
    ]
  },

  'design': {
    topic: 'design',
    prototypes: [
      'design principles and theory',
      'visual design',
      'design thinking',
      'creative design',
      'design process',
      'design tools',
      'design education',
      'design aesthetics',
      'design strategy',
      'professional design',
    ]
  },

  'fitness': {
    topic: 'fitness',
    prototypes: [
      'physical fitness and exercise',
      'workout routines',
      'strength training',
      'cardiovascular fitness',
      'fitness training',
      'personal training',
      'fitness goals',
      'exercise science',
      'fitness motivation',
      'healthy lifestyle',
    ]
  },

  'mental health': {
    topic: 'mental health',
    prototypes: [
      'mental health and wellbeing',
      'psychological health',
      'mental wellness',
      'stress management',
      'mental health awareness',
      'therapy and counseling',
      'mental health self care',
      'emotional health',
      'mental health support',
      'psychological wellbeing',
    ]
  },

  'cooking': {
    topic: 'cooking',
    prototypes: [
      'cooking and culinary arts',
      'food preparation',
      'recipes and cooking techniques',
      'culinary skills',
      'home cooking',
      'cooking tutorials',
      'food culture',
      'meal preparation',
      'cooking methods',
      'culinary education',
    ]
  },

  'music': {
    topic: 'music',
    prototypes: [
      'music and musical arts',
      'music theory',
      'music performance',
      'music composition',
      'music production',
      'music education',
      'musical instruments',
      'music history',
      'music appreciation',
      'music creation',
    ]
  },

  'writing': {
    topic: 'writing',
    prototypes: [
      'writing and composition',
      'creative writing',
      'content writing',
      'writing skills',
      'writing techniques',
      'writing process',
      'professional writing',
      'writing education',
      'storytelling',
      'written communication',
    ]
  },

  'philosophy': {
    topic: 'philosophy',
    prototypes: [
      'philosophy and philosophical thought',
      'ethical philosophy',
      'political philosophy',
      'metaphysics',
      'epistemology',
      'philosophical reasoning',
      'philosophy of mind',
      'philosophical education',
      'philosophical inquiry',
      'philosophical traditions',
    ]
  },

  'psychology': {
    topic: 'psychology',
    prototypes: [
      'psychology and mental processes',
      'cognitive psychology',
      'behavioral psychology',
      'social psychology',
      'psychological research',
      'psychological theory',
      'mental processes',
      'human behavior',
      'psychological education',
      'applied psychology',
    ]
  },

  'engineering': {
    topic: 'engineering',
    prototypes: [
      'engineering and technical design',
      'engineering principles',
      'engineering design',
      'technical problem solving',
      'engineering tools',
      'engineering education',
      'engineering applications',
      'systems engineering',
      'engineering methodology',
      'professional engineering',
    ]
  },
};

/**
 * Get semantic profile for a topic, with fallback to basic profile
 */
export function getSemanticProfile(topic: string): SemanticProfile {
  const profile = SEMANTIC_PROFILES[topic.toLowerCase()];
  if (profile) {
    return profile;
  }
  
  // Fallback: create a basic profile from the topic name
  return {
    topic,
    prototypes: [
      topic,
      `${topic} education`,
      `learning about ${topic}`,
      `${topic} skills`,
      `${topic} knowledge`,
    ]
  };
}
