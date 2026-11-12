function callableRoutes(functions) {
  return new Set(
    Object.entries(functions)
      .filter(([, handler]) => handler?.__endpoint?.callableTrigger)
      .map(([name]) => name),
  );
}
module.exports = { callableRoutes };
