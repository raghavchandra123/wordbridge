export const logDatabaseOperation = (operation: string, details: any) => {
  console.log(`🔍 DB ${operation}:`, {
    timestamp: new Date().toISOString(),
    ...details
  });
};

export const logError = (operation: string, error: any) => {
  console.error(`❌ DB Error in ${operation}:`, {
    timestamp: new Date().toISOString(),
    error
  });
};