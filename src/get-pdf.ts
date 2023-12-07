import extract from "pdf-text-extract";

export async function getPdfText(file: string): Promise<string> {
  return new Promise((resolve, reject) => {
    extract(
      file,
      { splitPages: false },
      function (err: string, text: string[]) {
        if (err) {
          console.dir(err);
          reject(err);
        }
        resolve(text.join("\n\n"));
      }
    );
  });
}
