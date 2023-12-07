import OpenAI from "openai";
import { resolve } from "path";
import chalk from "chalk";
import { getPdfText } from "./get-pdf";
import rl from "readline/promises";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { getFiles, saveResult } from "./files";
import path from "path";

const readline = rl.createInterface({
  input: process.stdin,
  output: process.stdout,
});

//const scooter = resolve("./docs/LG-SQC4R.pdf"); TODELETE

const openai = new OpenAI({
  apiKey: process.env["OPENAI_KEY"],
});

async function main() {
  const files = await getFiles();

  for (const file of files) {
    console.log("Handling ", file);

    if (! path.basename(file).endsWith(".pdf")) { 
      console.log('Warning: not a PDF file...\n\n');
     }
    else {
      await handleFile(file);
     }
  }
}

async function handleFile(file: string) {
  const pdfContent = await getPdfText(file);
  console.log("Got PDF content: ", pdfContent.length);

  let userContent = ""; // depending on the name of the file, the user prompt will be different

  if (path.basename(file).startsWith("review")) {
    console.log("Review document");
    userContent = `Parse the following document that contains a list of user reviews for a product. Write 5 positive statements and 5 negative statements on this product. Format it in English in a raw JSON format (not Markdown, just the JSON)\n
         
    The content to parse is the following:\n\n
    `;

  } else {
    console.log("Product document");
    userContent = `Please parse the following and format it in English in a raw JSON format (not Markdown, just the JSON) with the following properties:\n
        
    {
      "product_name": "name of the product",
      "brand": "brand of the product",
      "description": "description of the product",
      "features": [
        "feature 1",
        "feature 2",
        "feature 3"
      ],
      "compatibility": {
        "airplay": true, // or false, or null if unknown
        "bluetooth": true, // or false, or null if unknown
        "dolby_atmos": true, // or false, or null if unknown
        "dts_x": true, // or false, or null if unknown
        "google_cast": true, // or false, or null if unknown
        "spotify_connect": true, // or false, or null if unknown
      },
      "price": {
          "amount" : 100.00, // or null if unknown
          "currency": "As 3-letter ISO code, for example USD" // or null if unknown
      }
    }

    The content to parse is the following:\n\n
    `;
  }

  const chat: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content:
        "I am a bot that can parse audio product documents. The current date is " +
        new Date().toLocaleDateString(),
    },
    {
      role: "user",
      content:
        userContent + pdfContent,
    },
    ];

  const chatCompletion = await openai.chat.completions.create({
    messages: chat,
    model: "gpt-4-1106-preview",
    //model: "gpt-3.5-turbo"
    //model: "gpt-4"
  });
  console.log(
    "Answer: ",
    chalk.green(chatCompletion.choices[0].message.content)
  );
  const content = chatCompletion.choices[0].message
    .content!.split("\n")
    .slice(1, -1)
    .join("\n");
  await saveResult(file, content);
}

async function chatYourFile(file: string) {
  const pdfContent = await getPdfText(file);
  // console.log("content: ", pdfContent);
  const chat: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content:
        "I am a bot that can analyze audio product documents The current date is " +
        new Date().toLocaleDateString(),
    },
    {
      role: "user",
      content:
        "Please analyse the following and summarise into 3 paragraphs:\n\n" +
        pdfContent,
    },
  ];
  // const chatCompletion = await openai.chat.completions.create({
  //   messages: [],
  //   model: "gpt-4-1106-preview",
  // });
  // console.log("chatCompletion", chatCompletion.choices[0].message);

  while (true) {
    const chatCompletion = await openai.chat.completions.create({
      messages: chat,
      model: "gpt-4-1106-preview",
      //model: "gpt-3.5-turbo"
      //model: "gpt-4"
    });
    console.log(
      "Answer: ",
      chalk.green(chatCompletion.choices[0].message.content)
    );
    chat.push({
      role: "assistant",
      content: chatCompletion.choices[0].message.content,
    });
    const answer = await readline.question(`> `);
    if (answer === "exit") {
      break;
    }
    chat.push({
      role: "user",
      content: answer,
    });
  }
}

main();
