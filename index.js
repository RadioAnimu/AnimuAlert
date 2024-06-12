import { createRequire } from "module";
const require = createRequire(import.meta.url);
const config = require("./config.json");
const { EmbedBuilder, WebhookClient } = require("discord.js");
const { TwitterApi } = require("twitter-api-v2");
import * as fs from "fs";
import * as fss from "node:fs/promises";
const download = require("download");
import bluesky from "@atproto/api";
const { BskyAgent, RichText } = bluesky;

globalThis.lock = false;
globalThis.lockCopa = false;
globalThis.lockUni = false;
globalThis.lockFuk = false;
globalThis.lockGang = false;
globalThis.progAnterior = "";

let progImg = "";
let progNoAr = "";

const webhookClient = new WebhookClient({
  id: config.discord.webhookId,
  token: config.discord.webhookToken,
});

const watchdogClient = new WebhookClient({
  id: config.discord.watchdogId,
  token: config.discord.watchdogToken,
});

function watchdogSend(string) {
  if (config.discord.enabled) {
    try {
      watchdogClient.send({
        content: String(string),
        username: "Watchdog Alerta Animu",
      });
    } catch (error) {
      console.log("There was an error", error);
    }
  } else {
    console.log(string);
  }
}

const client = new TwitterApi({
  appKey: config.twitter.appKey,
  appSecret: config.twitter.appSecret,
  accessToken: config.twitter.accessToken,
  accessSecret: config.twitter.accessSecret,
});

const agent = new BskyAgent({
  service: "https://bsky.social"
});

watchdogSend("ANIMU ALERT ACTIVE");

async function checkSend() {
  try {
    let locutorJson = await fetch(config.endpoint_url + Math.random(), {
      signal: AbortSignal.timeout(5000),
    });
    let resposta = await locutorJson.json();
    let desc;

    function statusDump() {
      watchdogSend(`====================`);
      watchdogSend(`Programa: ${resposta.programa}`);
      watchdogSend(`Locutor: ${resposta.locutor}`);
      watchdogSend(`BLOCK ALERTA: ${global.lock}`);
      watchdogSend(`BLOCK Gang: ${global.lockGang}`);
    }

    statusDump();

    if (
      resposta.programa != global.progAnterior &&
      resposta.locutor == "Haruka Yuki"
    ) {
      globalThis.progAnterior = resposta.programa;
    }

    if (
      resposta.locutor != "Haruka Yuki" &&
      resposta.programa != "Manutenção"
    ) {
      watchdogSend("Programa ao vivo detectado");
      statusDump();

      progImg = resposta.social;
      progNoAr = resposta.programa;

      if (resposta.descricao.length > 0) {
        desc = resposta.descricao;
      } else {
        desc =
          "Está a começar o " + resposta.programa + " com " + resposta.locutor;
      }

      let copaReg = /Mundial/gim;
      let uniReg = /Universíadas/gim;
      let fukReg = /Fukuoka/gim;
      let gangReg = /Inverno/i;

      if (
        (!global.lockCopa && copaReg.test(progNoAr)) ||
        (!global.lockUni && uniReg.test(progNoAr)) ||
        (!global.lockFuk && fukReg.test(progNoAr)) ||
        (!global.lockGang && gangReg.test(progNoAr)) ||
        (!global.lock &&
          !uniReg.test(progNoAr) &&
          !copaReg.test(progNoAr) &&
          !fukReg.test(progNoAr) &&
          !gangReg.test(progNoAr))
      ) {
        watchdogSend("**A enviar alerta**");
        fs.writeFileSync("foo.webp", await download(progImg));
        global.lock = true;
        global.progAnterior = resposta.programa;

        // Twitter
        if (config.twitter.enabled) {
          const mediaId = await client.v1.uploadMedia("./foo.webp");
          client.v2
            .tweet(desc + "\n Ouça em: https://www.animu.com.br/", {
              media: { media_ids: [mediaId] },
            })
            .then((val) => {
              console.log(val);
              console.log("success");
            })
            .catch((err) => {
              console.log(err);
            });
        }

        // Discord
        if (config.discord.enabled) {
          var embed = new EmbedBuilder()
            .setTitle("**AGORA [NO AR]** 🔴")
            .setColor(0x7de915)
            .setImage(progImg)
            .setDescription(desc)
            .addFields({
              name: "Ouça em:",
              value: "https://www.animu.com.br/",
            });

          webhookClient.send({
            content: "@everyone Programa no ar na Animu!",
            username: "Alerta Animu!",
            avatarURL: config.discord.avatarUrl,
            embeds: [embed],
          });
        }

        //Bsky
        if (config.bsky.enabled) {
          const rt = new RichText({ text: desc + "\n Ouça em: animu.com.br" });
          await agent.login({
            identifier: config.bsky.accountEmail,
            password: config.bsky.accountPassword,
          });
          const imageData = await fss.readFile("./foo.webp");
          const imageUpload = await agent.uploadBlob(imageData, {
            encoding: "image/png",
          });

          const postRecord = {
            $type: "app.bsky.feed.post",
            text: rt.text,
            facets: rt.facets,
            createdAt: new Date().toISOString(),
            embed: {
              $type: "app.bsky.embed.images",
              images: [
                {
                  image: imageUpload.data.blob,
                  alt: "",
                },
              ],
            },
          };
          try{
          await agent.post(postRecord);
          } catch (error) {
      console.log("There was an error", error);
    }
        }

        global.lock = true;
        global.progAnterior = resposta.programa;
        let copaReg = /Mundial/gim;
        let uniReg = /Universíadas/gim;
        let fukReg = /Fukuoka/gim;
        let gangReg = /Inverno/im;

        if (copaReg.test(resposta.programa)) {
          global.lockCopa = true;
          global.progAnterior = resposta.programa;
          global.lock = true;
        }

        if (uniReg.test(resposta.programa)) {
          global.lockUni = true;
          global.progAnterior = resposta.programa;
          global.lock = true;
        }

       if (fukReg.test(resposta.programa)) {
          global.lockFuk = true;
          global.progAnterior = resposta.programa;
          global.lock = true;
       }

        if (gangReg.test(resposta.programa)){
          global.lockGang = true;
          global.progAnterior = resposta.programa;
          global.lock = true;
        }

        watchdogSend("Programa ao vivo enviado");
        statusDump();
      } else if (
        (copaReg.test(progNoAr) && global.lockCopa) ||
        (uniReg.test(progNoAr) && global.lockUni) ||
        (fukReg.test(progNoAr) && global.lockFuk) ||
        (gangReg.test(progNoAr) && global.lockGang)
      ) {
        watchdogSend(
          "Programa desportivo detectado e bloqueado, deixando blocks na mesma"
        );
        statusDump();
      } else if (
        resposta.locutor != "Haruka Yuki" &&
        resposta.programa != global.progAnterior
      ) {
        global.lock = false;
        watchdogSend(
          "Outro programa ao vivo a entrar no ar, a desligar o block."
        );
        statusDump();
      } else {
        watchdogSend("Haru no comando, deixando tudo na mesma.");
        statusDump();
      }
    }
  } catch (error) {
    console.log(error);
  }
}

checkSend();

setInterval(function () {
  try {
    checkSend();
  } catch (error) {
    console.log(error);
  }
}, config.interval_minutes * 60000);
