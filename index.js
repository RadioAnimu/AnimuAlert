import { createRequire } from "module";
const require = createRequire(import.meta.url);
const config = require("./config.json");
import fetch from 'node-fetch';
const { EmbedBuilder, WebhookClient } = require('discord.js');
const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs');
const download = require('download');

globalThis.lock = false;
globalThis.lockCopa = false;
let progImg = "";
let progNoAr = "";

if(config.discord.enabled){
const webhookClient = new WebhookClient({
  id: config.discord.webhookId,
  token: config.discord.webhookToken
});

const watchdogClient = new WebhookClient({
  id: config.discord.watchdogId,
  token: config.discord.watchdogToken
});


function watchdogSend(string) {
  if(config.discord.enabled){
  try {
    watchdogClient.send({
      content: String(string),
      username: 'Watchdog Alerta Animu',
    });
  } catch (error) {
    console.log('There was an error', error);
  }
  }
}
watchdogSend("ANIMU ALERT ACTIVE");
}

if(config.twitter.enabled){
const client = new TwitterApi({
  appKey: config.twitter.appKey,
  appSecret: config.twitter.appSecret,
  accessToken: config.twitter.accessToken,
  accessSecret: config.twitter.accessSecret,
});
}


console.log('ANIMU ALERT SYSTEM ACTIVE');

async function checkSend() {
  try {
    let locutorJson = await fetch("https://www.animu.com.br/teste/alert.php?time=" + Math.random());
    let resposta = await locutorJson.json();
    let desc;
   
    console.log("PROG STATUS | Locutor:  " + resposta.locutor + ", Programa: " + resposta.programa);
    console.log("BLOCK STATUS | BLOCK ALERTA: " + global.lock + ", BLOCK MUNDIAL: " + global.lockCopa);
    console.log("Programa Anterior: " + global.progAnterior);

    if (resposta.programa != global.progAnterior && resposta.locutor == "Haruka Yuki") {
      globalThis.progAnterior = resposta.programa;
    }

    if (resposta.locutor != "Haruka Yuki" && resposta.programa != "Manutenção") {
      if(config.discord.enabled){
        watchdogSend("Programa ao vivo detectado");
        watchdogSend("Programa: " + resposta.programa);
        watchdogSend("Locutor: " + resposta.locutor);
        watchdogSend("BLOCK ALERTA: " + global.lock);
        watchdogSend("BLOCK MUNDIAL: " + global.lockCopa);
    }
      progImg = resposta.social;
      progNoAr = resposta.programa;

      if (resposta.descricao.length > 0) {
        desc = resposta.descricao;
      } else {
        desc = "Está a começar o " + resposta.programa + " com " + resposta.locutor;
      }


      if ((!lockCopa && (global.progNoAr == "Mundial 2022" || global.progNoAr == "Mundial 2022 Brasil")) || !global.lock) {
        console.log("A enviar alerta");

// Twitter
        if(config.twitter.enabled){
        fs.writeFileSync('foo.webp', await download(progImg));
        const mediaId = await client.v1.uploadMedia('./foo.webp');
        client.v2.tweet(desc + '\n Ouça em: https://www.animu.com.br/', { media: { media_ids: [mediaId] } }).then((val) => {
          console.log(val);
          console.log("success");
        }).catch((err) => {
          console.log(err);
        });
        }

// Discord
        if(config.discord.enabled){
        var embed = new EmbedBuilder()
          .setTitle("**AGORA [NO AR]** 🔴")
          .setColor(0x7de915)
          .setImage(progImg)
          .setDescription(desc)
          .addFields(
            { name: 'Ouça em:', value: 'https://www.animu.com.br/' },
          );


        webhookClient.send({
          content: '@everyone Programa no ar na Animu!',
          username: 'Alerta Animu!',
          avatarURL: config.discord.avatarUrl,
          embeds: [embed],
        });
        }

        global.lock = true;
        globalThis.progAnterior = progNoAr;


        if (global.progNoAr == "Mundial 2022" || global.progNoAr == "Mundial 2022 Brasil") {
          global.lockCopa = true;
          global.progAnterior = global.progNoAr;
        }

      } else if ((global.progNoAr == "Mundial 2022" || global.progNoAr == "Mundial 2022 Brasil") && global.lockCopa) {
        watchdogSend("prog.desportiva detectada e bloqueada, deixando blocks na mesma");
      } else if (resposta.locutor != "Haruka Yuki" && resposta.programa != global.progAnterior) {
        global.lock = false;
        if(config.discord.enabled){
        watchdogSend("Outro programa ao vivo a entrar no ar, a desligar o block.");
        watchdogSend("Programa Anterior: " + global.progAnterior);
        watchdogSend("Programa: " + resposta.programa);
        }
      } else {
        if(config.discord.enabled){
          watchdogSend("Haru no comando, deixando tudo na mesma.");
          watchdogSend("Programa: " + resposta.programa);
          watchdogSend("Locutor: " + resposta.locutor);
          watchdogSend("BLOCK ALERTA: " + global.lock);
          watchdogSend("BLOCK MUNDIAL: " + global.lockCopa);
      }
      }
    }
  
  } catch (error) {
    console.log(error)
  }

}

checkSend();

setInterval(function () {
  checkSend();
}, 240000 );

