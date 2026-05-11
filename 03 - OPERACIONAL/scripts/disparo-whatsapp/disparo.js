const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

const ARQUIVO_LEADS = './leads.csv';
const ARQUIVO_LOG   = './envios.csv';
const INTERVALO_MIN = config.intervaloMinSegundos * 1000;
const INTERVALO_MAX = config.intervaloMaxSegundos * 1000;

function mensagem(nome) {
  return (
    `Oi ${nome}, tudo bem? ` +
    `Sou ${config.remetente}, especialista em recuperação de crédito para farmácias no Simples Nacional.\n\n` +
    `Tenho visto muitas farmácias pagando mais imposto do que deveriam — às vezes R$ 800 a R$ 2.000/mês de diferença.\n\n` +
    `Você já fez uma análise tributária da sua farmácia nos últimos 12 meses?`
  );
}

function intervaloAleatorio() {
  return Math.floor(Math.random() * (INTERVALO_MAX - INTERVALO_MIN + 1)) + INTERVALO_MIN;
}

function lerLeads() {
  if (!fs.existsSync(ARQUIVO_LEADS)) {
    console.error('❌  leads.csv não encontrado.');
    process.exit(1);
  }
  return parse(fs.readFileSync(ARQUIVO_LEADS, 'utf8'), {
    columns: true,
    skip_empty_lines: true,
  });
}

function jaEnviado(telefone) {
  if (!fs.existsSync(ARQUIVO_LOG)) return false;
  return fs.readFileSync(ARQUIVO_LOG, 'utf8').includes(telefone);
}

function registrar(lead, status) {
  if (!fs.existsSync(ARQUIVO_LOG)) {
    fs.writeFileSync(ARQUIVO_LOG, 'telefone,nome,data,hora,status\n');
  }
  const linha = stringify([[
    lead.telefone,
    lead.nome,
    new Date().toLocaleDateString('pt-BR'),
    new Date().toLocaleTimeString('pt-BR'),
    status,
  ]]);
  fs.appendFileSync(ARQUIVO_LOG, linha);
  console.log(`📝 ${lead.nome} (${lead.telefone}) → ${status}`);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  const todos     = lerLeads();
  const pendentes = todos.filter(l => !jaEnviado(l.telefone));

  console.log(`📋 Total: ${todos.length} leads | Pendentes: ${pendentes.length}`);

  if (pendentes.length === 0) {
    console.log('✅  Nenhum lead pendente.');
    process.exit(0);
  }

  const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: false },
  });

  client.on('qr', qr => {
    console.log('\n📱  Escaneie o QR Code com seu WhatsApp:\n');
    qrcode.generate(qr, { small: true });
  });

  client.on('ready', async () => {
    console.log('\n✅  Conectado. Iniciando disparos...\n');

    for (let i = 0; i < pendentes.length; i++) {
      const lead   = pendentes[i];
      const numero = `55${lead.telefone.replace(/\D/g, '')}@c.us`;

      try {
        await client.sendMessage(numero, mensagem(lead.nome));
        registrar(lead, 'enviado');
      } catch (err) {
        registrar(lead, `erro: ${err.message}`);
      }

      if (i < pendentes.length - 1) {
        const espera = intervaloAleatorio();
        console.log(`⏳  Aguardando ${Math.round(espera / 1000)}s...\n`);
        await sleep(espera);
      }
    }

    console.log('\n✅  Disparos concluídos. Verifique envios.csv.');
    await client.destroy();
    process.exit(0);
  });

  client.initialize();
}

main();
