export async function githubRetriever() {
  await new Promise((r) => setTimeout(r, 1000));

  console.log("GitHub finished");

  return {
    documents: ["GitHub Result"],
  };
}
