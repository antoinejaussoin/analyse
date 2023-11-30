import OpenAI from "openai";
import { resolve } from "path";
import chalk from "chalk";
import { getPdfText } from "./get-pdf";
import rl from "readline/promises";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";

const readline = rl.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const scooter = resolve("./docs/home.pdf");

const openai = new OpenAI({
  apiKey: process.env["OPENAI_KEY"],
});

async function main() {
  const pdfContent = await getPdfText(scooter);
  // console.log("content: ", pdfContent);
  const chat: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content:
        "I am a bot that can analyze insurance documents and answer questions about them. The current date is " +
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
