const BotWhatsapp = require('@bot-whatsapp/bot')

const catalogoFlow = BotWhatsapp.addKeyword(['catálogo', 'catalogo',])
.addAnswer('Aquí tienes nuestro catálogo de productos', {
    media: 'https://d3empresa.com/Productos%20Airon%20Tools/catalogo%20Airon%20Tools.pdf',
});

module.exports = catalogoFlow;