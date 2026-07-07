export async function readPage(url: string): Promise<string> {
  const response = await fetch(
    `https://r.jina.ai/http://${url.replace(/^https?:\/\//, "")}`,
  );

  return response.text();
}
