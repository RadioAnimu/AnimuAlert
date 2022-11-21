const { EmbedBuilder, WebhookClient} = require('discord.js');
const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs');
const download = require('download');
const webhookId = "";
const webhookToken = "";
const watchdogId = "";
const watchdogToken = "";
const avatarImage = "";

const webhookClient = new WebhookClient({
  id: webhookId,
  token: webhookToken
});

const watchdogClient = new WebhookClient({
  id: watchdogId,
  token: watchdogToken
});

global.lock = false;
global.progImg = "";
global.progNoAr = "";
const client = new TwitterApi({
  appKey: '',
  appSecret: '',
  accessToken: '',
  accessSecret: '',
});

function watchdogSend(string2send) {
  watchdogClient.send({
    content: String(string2send),
    username: 'Watchdog Alerta Animu',
  });
}

console.log('ANIMU ALERT SYSTEM ACTIVE AND ON DUTY, FUCK EM UP');
watchdogSend("ANIMU ALERT ACTIVE");

async function checkSend() {
  var locutorJSON = "https://www.animu.com.br/teste/alert.php?time=" + Math.random();
  let response = await fetch(locutorJSON);
  if (response.ok) {
    let json = await response.json();
    let desc;
    if (json.locutor != "Haruka Yuki") {
      console.log("Programa ao vivo detectado");
      progImg = json.logo;
      progNoAr = json.programa;
      if (json.descricao.length > 0) {
        desc = json.descricao;
      } else {
        desc = "Está a começar o " + json.programa + " com " + json.locutor;
      }
      if (!global.lock) {
        fs.writeFileSync('foo.webp', await download(progImg));
        const mediaId = await client.v1.uploadMedia('./foo.webp');
        client.v2.tweet(desc + '\n Ouça em: https://www.animu.com.br/', {
          media: {
            media_ids: [
              mediaId
            ]
          }
        }).then((val) => {
          console.log(val);
          console.log("success");
        }).catch((err) => {
          console.log(err);
        });
        var embed = new EmbedBuilder().setTitle("**AGORA [NO AR]** 🔴").setColor(0x7de915).setImage(progImg).setDescription(desc).addFields({
          name: 'Ouça em:',
          value: 'https://www.animu.com.br/'
        }, );
        webhookClient.send({
          content: '@everyone',
          username: 'Alerta Animu!',
          avatarURL: avatarImage,
          embeds: [
            embed
          ],
        });
        global.lock = true;
      }
    } else if (json.locutor != "Haruka Yuki" && json.programa != global.progNoAr) {
      global.lock = false;
    } else {
      global.lock = false;
    }
  } else {
    console.log("Oh shit! Erro: " + response.status);
  }
}

checkSend();
setInterval(checkSend, 120000);
setInterval(function () {
  watchdogSend("ANIMU ALERT HOURLY VIBE CHECK")
}, 3600000);
