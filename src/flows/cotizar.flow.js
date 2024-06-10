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
            return fallBack(`¿El nombre ${state.getMyState().name} es correcto?`);
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
            await state.update({exit: 0});
            await state.update({verifyCompany: 0});
            await flowDynamic(`De acuerdo a tu solicitud, el nombre de la persona de contacto es ${state.getMyState().name}`);
        }

        if(confirm === null){
            return fallBack(`Disculpa, no entendí tu respuesta. ¿El nombre ${state.getMyState().name} es correcto?`);
        }

    })
.addAnswer('¿Cuál es el nombre de la empresa del cual nos contacta?',  {capture: true},
    async(ctx, {state, flowDynamic, fallBack, endFlow}) => {
            
            if((ctx.body.toLowerCase().match(/salir|cancelar|terminar|finalizar|adios|chao/gi)) || (ctx.body === null)){
                await state.update({exit: 1});
                return endFlow('Se ha cancelado la cotización');
            }
    
            if(state.getMyState().exit === 1){
                return endFlow('Se ha cancelado la cotización');
            }

            if(state.getMyState().verifyCompany === 0){
                // Implementa una validación de nombre de empresa con REGEX
                const companyRegex = /^[a-zA-Z\s]{3,50}$/;
                await state.update({company: ctx.body});
                const company = state.getMyState().company;
        
                if(!companyRegex.test(company)){
                    return fallBack('Por favor, ingresa un nombre de empresa válido');
                }
                await state.update({verifyCompany: 1});
            }

            if(state.getMyState().verifyCompany === 1){
                await state.update({verifyCompany: 2});
                return fallBack(`¿El nombre de la empresa ${state.getMyState().company} es correcto?`);
            }

            // Extraer si en la respuesta del usuario se encuentra la palabra "no" o "si" con REGEX sin importar mayúsculas o minúsculas
            const response = ctx.body.toLowerCase();
            const match = response.match(/no|si/gi);
            const confirm = match ? match[0] : null;
            console.log(confirm);

            if(confirm === 'no'){
                await state.update({verifyCompany: 0});
                return fallBack('Por favor, ingresa el nombre de la empresa');
            }

            if(confirm === 'si'){
                await state.update({exit: 0});
                await state.update({verifyEmail: 0});
                await flowDynamic(`De acuerdo a tu solicitud, el nombre de la empresa es ${state.getMyState().company}`);
            }

            if(confirm === null){
                return fallBack(`Disculpa, no entendí tu respuesta. ¿El nombre de la empresa ${state.getMyState().company} es correcto?`);
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

        if(state.getMyState().verifyEmail === 0){
            // Implementa una validación de correo electrónico con REGEX
            const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
            await state.update({email: ctx.body});
            const email = state.getMyState().email;
    
            if(!emailRegex.test(email)){
                return fallBack('Por favor, ingresa un correo electrónico válido');
            }
            await state.update({verifyEmail: 1});
        }

        if(state.getMyState().verifyEmail === 1){
            await state.update({verifyEmail: 2});
            return fallBack(`¿El correo electrónico ${state.getMyState().email} es correcto?`);
        }

        // Extraer si en la respuesta del usuario se encuentra la palabra "no" o "si" con REGEX sin importar mayúsculas o minúsculas
        const response = ctx.body.toLowerCase();
        const match = response.match(/no|si/gi);
        const confirm = match ? match[0] : null;
        console.log(confirm);

        if(confirm === 'no'){
            await state.update({verifyEmail: 0});
            return fallBack('Por favor, ingresa el correo electrónico');
        }

        if(confirm === 'si'){
            await state.update({exit: 0});
            await state.update({verifyPhone: 1});
            await flowDynamic(`De acuerdo a tu solicitud, el correo electrónico es ${state.getMyState().email}`);
        }

        if(confirm === null){
            return fallBack(`Disculpa, no entendí tu respuesta. ¿El correo electrónico ${state.getMyState().email} es correcto?`);
        }

    })
.addAnswer(`¿Deseas agregar este número de teléfono para contactarte?`,  {capture: true},
    async(ctx, {state, flowDynamic, fallBack, endFlow}) => {

        // Obtiene los últimos 10 dígitos de la cadena de texto

        const phone = ctx.from.match(/\d{10}$/g);
        await state.update({phone: phone[0]});


        if((ctx.body.toLowerCase().match(/salir|cancelar|terminar|finalizar|adios|chao/gi)) || (ctx.body === null)){
            await state.update({exit: 1});
            return endFlow('Se ha cancelado la cotización');
        }

        if(state.getMyState().exit === 1){
            return endFlow('Se ha cancelado la cotización');
        }

        if(state.getMyState().verifyPhone === 0){
            // Implementa un formateo de número de teléfono con REGEX
            // Sin espacios, guiones o paréntesis, solo 10 dígitos
            // Ejemplo: mi número es 12-34 5678 90. -> 1234567890

            const phone = ctx.body.match(/\d{10}$/g);
            
            const phoneRegex = /^\d{10}$/;
            
            if(!phoneRegex.test(phone)){
                return fallBack('Por favor, ingresa un número de teléfono válido');
                }
            await state.update({phone: phone[0]});
            await state.update({verifyPhone: 2});
        }

        if(state.getMyState().verifyPhone === 2){
            await state.update({verifyPhone: 3});
            return fallBack(`¿El número de teléfono ${state.getMyState().phone} es correcto?`);
        }

        // Extraer si en la respuesta del usuario se encuentra la palabra "no" o "si" con REGEX sin importar mayúsculas o minúsculas
        const response = ctx.body.toLowerCase();
        const match = response.match(/no|si/gi);
        const confirm = match ? match[0] : null;
        

        if(confirm === 'no'){
            await state.update({verifyPhone: 0});
            return fallBack('Por favor, ingresa el número de teléfono que deseas agregar');
        }

        if(confirm === 'si'){
            await state.update({exit: 0});
            await state.update({verifyAddress: 0});
            await flowDynamic(`De acuerdo a tu solicitud, el número de teléfono es ${state.getMyState().phone}`);
        }

        if(confirm === null){
            return fallBack(`Disculpa, no entendí tu respuesta. ¿El número de teléfono ${state.getMyState().phone} es correcto?`);
        }

    })
.addAnswer('Gracias por proporcionar la información, en breve te enviaremos la cotización.');




module.exports = cotizarFlow