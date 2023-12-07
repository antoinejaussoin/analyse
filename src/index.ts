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

const scooter = resolve("./docs/LG-SQC4R.pdf");

const openai = new OpenAI({
  apiKey: process.env["OPENAI_KEY"],
});

async function main() {
  const files = await getFiles();

  for (const file of files) {
    console.log("Handling ", file);

    await handleFile(file);
  }
}

async function handleFile(file: string) {
  const pdfContent = await getPdfText(file);
  console.log("Got PDF content: ", pdfContent.length);
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
        `Please parse the following and format it in English in a raw JSON format (not Markdown, just the JSON) with the following properties:\n
        
        {
          "name": "name of the product",
          "brand": "brand of the product",
          "description": "description of the product",
          "price": {
              "original" : 100.00
          }
        }

        The content to parse is the following:\n\n
        ` + pdfContent,
    },
  ];
  // const chatCompletion = await openai.chat.completions.create({
  //   messages: [],
  //   model: "gpt-4-1106-preview",
  // });
  // console.log("chatCompletion", chatCompletion.choices[0].message);

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
  await saveResult(file, chatCompletion.choices[0].message.content!);
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
