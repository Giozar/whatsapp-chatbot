const BotWhatsapp = require('@bot-whatsapp/bot')

const cotizarFlow = BotWhatsapp.addKeyword(['Cotizar', 'Cotización', 'Cotiza', 'Cotización de producto', 'Cotización de productos', 'Cotizar producto', 'Cotizar productos', 'Cotizar herramienta', 'Cotizar herramientas', 'Cotización de herramienta',])
.addAnswer('¿Qué producto deseas cotizar? lo necesito para generar tu cotización',  {capture: true}, 
    async(ctx, {state, flowDynamic, fallBack}) => {

        if(ctx.body.length < 2){        
            return fallBack('Por favor, especifica el producto que deseas cotizar');
        }

        await state.update({product: ctx.body});
 
        const product = state.getMyState().product;
        await flowDynamic(`De acuerdo a tu solicitud, el producto que deseas cotizar es ${product}.`)
    })
.addAnswer('¿Cuántas unidades necesitas?',  {capture: true},
    async(ctx, {state, flowDynamic, fallBack}) => {
        // Extrae el número de unidades de la respuesta del usuario
        // Validamos que el número de unidades sea mayor a 0 y que sea un número
        const units = parseInt(ctx.body);

        if(isNaN(units) || units < 1){
            return fallBack('Por favor, ingresa un número válido de unidades');
        }

        await state.update({quantity: units});
        const quantity = state.getMyState().quantity;
        const product = state.getMyState().product;

        await flowDynamic(`De acuerdo a tu solicitud, necesitas ${quantity} unidades del ${product}.`);

        
    })
.addAnswer('¿Cuál es tu nombre completo? o el nombre de la persona de contacto',  {capture: true},
    async(ctx, {state, flowDynamic, fallBack}) => {
        // Implementa una validación de nombre con REGEX
        const nameRegex = /^[a-zA-Z\s]{3,50}$/;
        await state.update({name: ctx.body});
        const name = state.getMyState().name;
        if(!nameRegex.test(name)){
            return fallBack('Por favor, ingresa un nombre válido');
        }
        
        await flowDynamic(`De acuerdo a tu solicitud, el nombre de la persona de contacto es ${name}.`)

    })
.addAnswer('¿Cuál es tu correo electrónico?',  {capture: true},
    async(ctx, {state, flowDynamic, fallBack}) => {
        // Implemeta una validación de correo electrónico con REGEX
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        await state.update({email: ctx.body});
        const email = state.getMyState().email;
        if(!emailRegex.test(email)){
            return fallBack('Por favor, ingresa un correo electrónico válido');
        }
    })
.addAnswer('Gracias por proporcionar la información, en breve te enviaremos la cotización.',);




module.exports = cotizarFlow