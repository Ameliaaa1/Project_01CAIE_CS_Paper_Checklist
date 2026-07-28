function createDeferredPdfAdapter() {
  return {
    name: "deferred-pdf-adapter",
    async extractPages() {
      throw new Error("PDF extraction is intentionally isolated from the ingestion framework.");
    }
  };
}

module.exports = {
  createDeferredPdfAdapter
};
