const { createBot, createProvider, createFlow, addKeyword, EVENTS } = require('@bot-whatsapp/bot')

const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const MockAdapter = require('@bot-whatsapp/database/mock')
const path = require('path')
const fs = require('fs')
const { delay } = require('@whiskeysockets/baileys')

// Mensaje principal
const pedidoPath = path.join(__dirname, "mensajes", "pedido.txt")
const pedido = fs.readFileSync(pedidoPath, "utf-8")

// Mensajes de pedido
const pedidolocalPath = path.join(__dirname, "mensajes", "pedidolocal.txt")
const pedidolocal = fs.readFileSync(pedidolocalPath, "utf-8")

const pedidotiendaPath = path.join(__dirname, "mensajes", "pedidotienda.txt")
const pedidotienda = fs.readFileSync(pedidotiendaPath, "utf-8")

// Mensajes de pago
const pagoYapePath = path.join(__dirname, "mensajes", "pagoYape.txt")
const pagoYape = fs.readFileSync(pagoYapePath, "utf-8")

const pagoEfectivoPath = path.join(__dirname, "mensajes", "pagoEfectivo.txt")
const pagoEfectivo = fs.readFileSync(pagoEfectivoPath, "utf-8")

// Mensajes de confirmación
const confYapePath = path.join(__dirname, "mensajes", "confYape.txt")
const confYape = fs.readFileSync(confYapePath, "utf-8")

const confEfectivoPath = path.join(__dirname, "mensajes", "confEfectivo.txt")
const confEfectivo = fs.readFileSync(confEfectivoPath, "utf-8")

// Vlidacion Página web
const validacionPath = path.join(__dirname, "mensajes", "validationInfo.txt")
const validacionInfo = fs.readFileSync(validacionPath, "utf-8")

// Imagenes
const charly= path.join(__dirname, "Charly.jpg");
const QRpago = path.join(__dirname, "QRpago.jpg");
const preparandopedido = path.join(__dirname, "Charly-Ent-Ped.jpg");
const recordatorio = path.join(__dirname, "Charly-Gafas.jpg");

// Validación de pago
const validationFlow = addKeyword(EVENTS.MEDIA).addAnswer(  
    "Voy a validar el pago y prepararé su pedido. Puedes pasar a recogerlo en 10 min\n", {media:preparandopedido},
    async (ctx, { flowDynamic }) => {
        setTimeout(async () => {
            await flowDynamic(validacionInfo, { media: recordatorio });
        }, 120000);
    }
)

// Pago con Yape
const yapeFlow = addKeyword("yape")
.addAnswer(pagoYape, {media:QRpago})

// Pago en efectivo
const efectivoFlow = addKeyword("efectivo").addAnswer(
    pagoEfectivo, {media:preparandopedido},
    async (ctx, { flowDynamic }) => {
        setTimeout(async () => {
            await flowDynamic(validacionInfo, { media: recordatorio });
        }, 120000);
    }
)

// Mensajes de pago en Tienda
const flowTienda = addKeyword(EVENTS.ACTION).addAnswer(
    pedidotienda, {media:QRpago}
)

//Mensajes de pago el Local
const flowLocal = addKeyword("pago").addAnswer(
    pedidolocal,
    { capture: true },
    async (ctx, { gotoFlow, fallBack, flowDynamic }) => {
        if (!["1", "2"].includes(ctx.body)) {
            return fallBack(
                "Respuesta no válida, por favor selecciona una de las opciones."
            );
        }
        switch (ctx.body) {
            case "1":
                return gotoFlow(yapeFlow);
            case "2":
                return gotoFlow(efectivoFlow);
        }
    }
)

// Validación de pago con Yape
const validationYapeFlow = addKeyword(EVENTS.ACTION).addAnswer(
    confYape, { capture: true }, async (ctx, { flowDynamic, gotoFlow }) => {
        switch (ctx.body) {
        case '1':
            return gotoFlow(flowLocal)

        case '2':
            return gotoFlow(flowTienda);

        default:
            await flowDynamic('Por favor escriba una opción correcta');
        }
    }
)

// Mensajes de Pedido
const pedidoFlow = addKeyword("pedido")
    .addAnswer('Hola soy charly, seré tu mesero virtual\n',{media:charly})
    .addAnswer(pedido, { capture: true }, async (ctx, { flowDynamic, gotoFlow }) => {
        switch (ctx.body) {
        case '1':
            return gotoFlow(flowLocal)

        case '2':
            return gotoFlow(flowTienda);

        default:
            await flowDynamic('Por favor escriba una opción correcta');
        }
});  

const main = async () => {
    const adapterDB = new MockAdapter()
    const adapterFlow = createFlow([pedidoFlow, flowLocal, flowTienda, yapeFlow, efectivoFlow, validationFlow])
    const adapterProvider = createProvider(BaileysProvider)

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    QRPortalWeb()
}

main()
