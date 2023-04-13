//@ts-check
const { EmbedBuilder, WebhookClient } = require('discord.js');
const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs');
const download = require('download');
const config = require("./config.json");

const webhookClient = new WebhookClient({
  id: config.discord.webhookId,
  token: config.discord.webhookToken
});

const watchdogClient = new WebhookClient({
  id: config.discord.watchdogId,
  token: config.discord.watchdogToken
});

globalThis.lock = false;
globalThis.lockCopa = false;
let progImg = "";
let progNoAr = "";

const client = new TwitterApi({
  appKey: config.twitter.appKey,
  appSecret: config.twitter.appSecret,
  accessToken: config.twitter.accessToken,
  accessSecret: config.twitter.accessSecret,
});

function watchdogSend(string2send) {
  try {
    watchdogClient.send({
      content: String(string2send),
      username: 'Watchdog Alerta Animu',
    });
  } catch (error) {
    console.log(error);
  }
}

console.log('ANIMU ALERT SYSTEM ACTIVE AND ON DUTY');
watchdogSend("ANIMU ALERT ACTIVE");

async function checkSend() {
  var locutorJSON = "https://www.animu.com.br/teste/alert.php?time=" + Math.random();
  let response;
try {
  response = await  fetch(locutorJSON);
  if (response.ok) {
    let json = await response.json();
    let desc;

    watchdogSend("PROG STATUS | Locutor:  " + json.locutor + ", Programa: " + json.programa);
    watchdogSend("BLOCK STATUS | BLOCK ALERTA: " + global.lock + ", BLOCK MUNDIAL: " + global.lockCopa);
    watchdogSend("Programa Anterior: " + global.progAnterior);

    if (json.programa != global.progAnterior && json.locutor == "Haruka Yuki") {
      globalThis.progAnterior = json.programa;
    }

    if (json.locutor != "Haruka Yuki" && json.programa != "Manutenção") {
      console.log("Programa ao vivo detectado");
      console.log("Programa: " + json.programa);
      console.log("Locutor: " + json.locutor);
      console.log("BLOCK ALERTA: " + global.lock);
      console.log("BLOCK MUNDIAL: " + global.lockCopa);
      progImg = json.social;
      progNoAr = json.programa;

      if (json.descricao.length > 0) {
        desc = json.descricao;
      } else {
        desc = "Está a começar o " + json.programa + " com " + json.locutor;
      }


      if ((!lockCopa && (global.progNoAr == "Mundial 2022" || global.progNoAr == "Mundial 2022 Brasil")) || !global.lock) {
        console.log("A enviar alerta");


        fs.writeFileSync('foo.webp', await download(progImg));
        const mediaId = await client.v1.uploadMedia('./foo.webp');
        client.v2.tweet(desc + '\n Ouça em: https://www.animu.com.br/', { media: { media_ids: [mediaId] } }).then((val) => {
          console.log(val);
          console.log("success");
        }).catch((err) => {
          console.log(err);
        });

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

        global.lock = true;
        globalThis.progAnterior = progNoAr;


        if (global.progNoAr == "Mundial 2022" || global.progNoAr == "Mundial 2022 Brasil") {
          global.lockCopa = true;
          global.progAnterior = global.progNoAr;
        }

      } else if ((global.progNoAr == "Mundial 2022" || global.progNoAr == "Mundial 2022 Brasil") && global.lockCopa) {
        watchdogSend("prog.desportiva detectada e bloqueada, deixando blocks na mesma");
      } else if (json.locutor != "Haruka Yuki" && json.programa != global.progAnterior) {
        global.lock = false;
        watchdogSend("Outro programa ao vivo a entrar no ar, a desligar o block.");
        console.log("Programa Anterior: " + global.progAnterior);
        console.log("Programa: " + json.programa);
      } else {
        watchdogSend("Haru no comando, deixando tudo na mesma.");
        console.log("Programa: " + json.programa);
        console.log("Locutor: " + json.locutor);
        console.log("BLOCK ALERTA: " + global.lock);
        console.log("BLOCK MUNDIAL: " + global.lockCopa);
      }
    }
  }
} catch (error) {
  console.log('There was an error', error);
}

}

setInterval(function () {
  try {
    checkSend();
  } catch (error) {
    console.log(error);
  }
}, 120000);

checkSend();
setInterval(function () { watchdogSend("ANIMU ALERT HOURLY VIBE CHECK") }, 3600000);
