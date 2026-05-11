---
tags: [operacao]
---

# Automação — Disparo Inicial WhatsApp

## 🧠 Essência

Script Node.js que lê leads.csv, envia a mensagem inicial para cada contato via WhatsApp Web, aguarda intervalo aleatório de 45–90s entre envios e registra tudo em envios.csv. Sem follow-up automático — só o disparo inicial para validar taxa de resposta.

## ⚙️ Ação

### Pré-requisitos

* Node.js instalado → [nodejs.org](https://nodejs.org)
* Google Chrome instalado

### Configuração (fazer uma vez)

```bash
cd scripts/disparo-whatsapp
npm install
```

Abrir `config.json` e colocar seu nome em `remetente`.

### Adicionar leads

Editar `leads.csv` com nome e telefone (só números, com DDD):

```
nome,telefone
Farmácia Central,11999990001
Drogaria São Paulo,11999990002
```

### Executar

```bash
node disparo.js
```

* Na primeira vez: escanear QR Code com WhatsApp
* Script envia, espera, envia — sem intervenção necessária
* Ao terminar: checar `envios.csv` para ver status de cada envio

### Segurança

* Intervalo aleatório evita bloqueio por ritmo robótico
* Script não envia para quem já está em `envios.csv` (idempotente)
* Sessão salva localmente — QR Code só na primeira vez

## 🔗 Conexões

* [[00 - SISTEMA]]
* [[Prospecção]]
