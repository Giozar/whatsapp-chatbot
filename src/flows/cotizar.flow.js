const BotWhatsapp = require('@bot-whatsapp/bot')

const cotizarFlow = BotWhatsapp.addKeyword(['Cotizar', 'Cotización', 'Cotiza', 'Cotización de producto', 'Cotización de productos', 'Cotizar producto', 'Cotizar productos', 'Cotizar herramienta', 'Cotizar herramientas', 'Cotización de herramienta',])
.addAnswer('¿Qué producto deseas cotizar? lo necesito para generar tu cotización',  {capture: true}, 
    async(ctx, {state, flowDynamic, fallBack, endFlow}) => {

        if((ctx.body.toLowerCase().match(/salir|cancelar|terminar|finalizar|adios|chao/gi)) || (ctx.body === null)){
            await state.update({exit: 1});
            return endFlow('Se ha cancelado la cotización');
        }

        if(ctx.body.length < 2){        
            return fallBack('Por favor, especifica el producto que deseas cotizar');
        }

        await state.update({product: ctx.body});
 
        const product = state.getMyState().product;

        if(product){
            await state.update({exit: 0});
            await flowDynamic(`De acuerdo a tu solicitud, el producto que deseas cotizar es ${product}.`)
        }
    })
.addAnswer('¿Cuántas unidades necesitas?',  {capture: true},
    async(ctx, {state, flowDynamic, fallBack, endFlow}) => {

        if((ctx.body.toLowerCase().match(/salir|cancelar|terminar|finalizar|adios|chao/gi)) || (ctx.body === null)){
            await state.update({exit: 1});
            return endFlow('Se ha cancelado la cotización');
        }

        if(state.getMyState().exit === 1){
            return endFlow('Se ha cancelado la cotización');
        }

        // Extrae el número de unidades de la respuesta del usuario
        // Validamos que el número de unidades sea mayor a 0 y que sea un número
        // De la cadena de texto extraeremos el número de unidades, por ejemplo: "Necesito 10 unidades" -> 10

        const units = parseInt(ctx.body.match(/\d+/g));

        if(isNaN(units) || units < 1){
            return fallBack('Por favor, ingresa un número válido de unidades');
        }

        await state.update({quantity: units});
        const quantity = state.getMyState().quantity;
        const product = state.getMyState().product;

        if(quantity && product){
            await state.update({exit: 0});
            await flowDynamic(`De acuerdo a tu solicitud, necesitas ${quantity} unidades de ${product}.`);
        }

        await state.update({verifyName: 0});
    })
.addAnswer('¿Cuál es tu nombre completo? o el nombre de la persona de contacto',  {capture: true},
    async(ctx, {state, flowDynamic, fallBack, endFlow}) => {

        if((ctx.body.toLowerCase().match(/salir|cancelar|terminar|finalizar|adios|chao/gi)) || (ctx.body === null)){
            await state.update({exit: 1});
            return endFlow('Se ha cancelado la cotización');
        }
        
        // Implementa una validación de nombre con REGEX
        if (state.getMyState().verifyName === 0) {
            const nameRegex = /^[a-zA-Z\s]{3,50}$/;
            await state.update({name: ctx.body});
            const name = state.getMyState().name;

            if(!nameRegex.test(name)){
                return fallBack('Por favor, ingresa un nombre válido');
            }
            // await flowDynamic(`De acuerdo a tu solicitud, el nombre de la persona de contacto es ${name}`);

            await state.update({verifyName: 1});
            
        }

        if (state.getMyState().verifyName === 1) {
            await state.update({verifyName: 2});
            return fallBack('¿El nombre es correcto?');
        }

        // Extraer si en la respuesta del usuario se encuentra la palabra "no" o "si" con REGEX sin importar mayúsculas o minúsculas
        const response = ctx.body.toLowerCase();

        console.log(response);
        
        const match = response.match(/no|si/gi);
        const confirm = match ? match[0] : null; 
        console.log(confirm);

        if(confirm === 'no'){
            await state.update({verifyName: 0});
            return fallBack('Por favor, ingresa el nombre de la persona de contacto');
        }

        if(confirm === 'si'){
            await state.update({exit: 2});
            await flowDynamic(`De acuerdo a tu solicitud, el nombre de la persona de contacto es ${state.getMyState().name}`);
        }

    })
.addAnswer('¿Cuál es tu correo electrónico?',  {capture: true},
    async(ctx, {state, flowDynamic, fallBack, endFlow}) => {

        if((ctx.body.toLowerCase().match(/salir|cancelar|terminar|finalizar|adios|chao/gi)) || (ctx.body === null)){
            await state.update({exit: 1});
            return endFlow('Se ha cancelado la cotización');
        }

        if(state.getMyState().exit === 1){
            return endFlow('Se ha cancelado la cotización');
        }
        // Implemeta una validación de correo electrónico con REGEX
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        await state.update({email: ctx.body});
        const email = state.getMyState().email;
        if(!emailRegex.test(email)){
            return fallBack('Por favor, ingresa un correo electrónico válido');
        }
    })
.addAnswer('Gracias por proporcionar la información, en breve te enviaremos la cotización.');




module.exports = cotizarFlow