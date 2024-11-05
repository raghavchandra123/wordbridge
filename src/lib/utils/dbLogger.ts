export const logDatabaseOperation = (operation: string, details: any) => {
  console.log(`🔍 DB ${operation}:`, {
    timestamp: new Date().toISOString(),
    ...details
  });
};