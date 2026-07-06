export async function pdfRetriever() {
  await new Promise((r) => setTimeout(r, 2000));

  console.log("PDF finished");

  return {
    documents: ["PDF Result"],
  };
}
