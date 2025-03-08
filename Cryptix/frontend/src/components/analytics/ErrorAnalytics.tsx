// [Previous imports and interfaces...]

const generateTopIssues = () => {
  const issues = [
    'Connection timeout',
    'Invalid token',
    'Database deadlock',
    'Memory overflow',
    'API rate limit exceeded',
  ];
  
  return issues.map((message, index) => ({
    id: `ERR-${1000 + index}`,
    message,
    count: 50 + Math.random() * 100,
    firstSeen: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
    lastSeen: new Date(Date.now() - Math.random() * 3600000).toISOString(),
    status: Math.random() > 0.3 ? ('active' as const) : ('resolved' as const),
    priority: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as 'low' | 'medium' | 'high' | 'critical',
  }));
};

// [Rest of the component code...]
