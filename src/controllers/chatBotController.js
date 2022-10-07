require('dotenv').config();
const request = require('request');
const axios = require('axios');
const uuid = require("uuid");
const dialogflow = require('./dialogFlowController');
const { structProtoToJson } = require("../helpers/structFunctions");
const { createClient, editClient } = require("../controllers/clientController");
const { createVisit, editVisit, getCurrentVisit } = require("../controllers/visitController");

//mongodb models

const Client = require("../models/client");
const Product = require('../models/product');
const Visit = require('../models/visit');
const Deal = require('../models/deal');
const Category = require('../models/category');
const Image = require('../models/image');
const Discount = require('../models/discount');
const Query = require('../models/query');






const MY_VERIFY_TOKEN = process.env.MY_VERIFY_FB_TOKEN;



const sessionIds = new Map();

async function setSessionAndUser(senderId) {
  try {
    if (!sessionIds.has(senderId)) {
      sessionIds.set(senderId, uuid.v1());
    }
  } catch (error) {
    throw error;
  }
}


const postWebHook = (req, res) => {
  let body = req.body;


  if (body.object === "page") {

    body.entry.forEach(function (entry) {
      let webhook_event = entry.messaging[0];
      let sender_psid = webhook_event.sender.id;

      entry.messaging.forEach(function (messagingEvent) {
        if (messagingEvent.message) {
          receivedMessage(messagingEvent);
        } else if (messagingEvent.postback) {
          receivedPostback(messagingEvent);
        } else {
          console.log("Webhook received unknown messagingEvent Else: ");
        }
      });
    });

    res.status(200).send("EVENT_RECEIVED");


  } else {
    res.sendStatus(404);
  }
};

const getWebHook = (req, res) => {

  let VERIFY_TOKEN = MY_VERIFY_TOKEN;

  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
};


async function receivedMessage(event) {
  var senderId = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;
  // console.log(
  //   "Received message for user %d and page %d at %d with message:",
  //   senderId,
  //   recipientID,
  //   timeOfMessage
  // );

  var messageId = message.mid;

  // You may get a text or attachment but not both
  var messageText = message.text;
  var messageAttachments = message.attachments;
  var quickReply = message.quick_reply;

  if (quickReply) {
    handleQuickReply(senderId, quickReply, messageId);
    return;
  }

  saveUserData(senderId);


  if (messageText) {
    //send message to api.ai
    console.log("se recibio este mensaje: ", messageText);
    await sendToDialogFlow(senderId, messageText);
  } else if (messageAttachments) {
    handleMessageAttachments(messageAttachments, senderId);
  }
}



async function saveUserData(facebookId) {
  const clientDoc = await Client.findOne({ facebookId });
  if (clientDoc) {
    return;
  }
  let userData = await getUserData(facebookId);
  if (userData.first_name == null || userData.last_name == null
    || userData.first_name == "" || userData.last_name == "") return;
  await createClient(
    userData.first_name,
    userData.last_name,
    userData.profile_pic,
    facebookId
  );
}





async function receivedPostback(event) {
  console.log('recivedPostBack');
  var senderId = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  var payload = event.postback.payload;
  let result;
  switch (payload) {
    default:
      //unindentified payload
      sendToDialogFlow(senderId, payload);
      break;
  }

}

function handleMessageAttachments(messageAttachments, senderId) {
  //for now just reply
  sendTextMessage(senderId, "Archivo adjunto recibido... gracias! .");
}

async function handleQuickReply(senderId, quickReply, messageId) {
  let quickReplyPayload = quickReply.payload;
  console.log(
    "Quick reply for message %s with payload %s",
    messageId,
    quickReplyPayload
  );
  // send payload to api.ai
  sendToDialogFlow(senderId, quickReplyPayload);
}

async function handleDialogFlowAction(
  sender,
  action,
  messages,
  contexts,
  parameters
) {
  switch (action) {
    case "input.welcome":
      await createVisit(sender);
      handleMessages(messages, sender);
      break;



    case "oferta.action":  //Los productos que tenemos en oferta son: {productos_oferta} ¿Cuál le interesa?
      var polerasx = await getProductsFromDeal(sender);
      var cardsx = [];
      polerasx.forEach((polera) => {
        let disc = polera.deal != '0%' ? "(Descuento " + polera.deal + " )" : "";
        cardsx.push({
          title: polera.name + "  $" + polera.priceDeal + disc,
          image_url: polera.image[0],
          subtitle: polera.categoria,
          buttons: [
            {
              type: "postback",
              title: "Me gusta",
              payload: "me_gusta",
            },
            {
              type: "postback",
              title: "No me gusta",
              payload: "no_me_gusta",
            },
          ],
        });
      });
      await sendGenericMessage(sender, cardsx);
      await sendTextMessage(sender, 'Estos son los productos con descuentos');
      break;


    case "ofertaCategoria.action": //[x] (si o no) Tenemos en oferta. ¿Cuál polera le interesa?

      break;

    case "ofertaEspecifica.action":  //La polera en oferta {polera_especifica_oferta} (mostrar informacion - precio de dicha polera) ¿Te gustaría comprar este producto?


      break;

    case "poleraCatalogo.action": //{catologo_poleras} ¿Cuál polera le interesa?
      sendCategories(sender);
      break;


    case "poleraCategoria.action": //Las poleras {categoria_polera} que tenemos disponibles son las siguientes: {lista_polera_categoria} (lista de poleras de la categoriaPolera) ¿Cuál de las poleras le interesa?
      let params = parameters.fields.categoriapolera.stringValue.toUpperCase();
      let category = await Category.findOne({ name: params });
      let mapa = {};
      if (category) {
        mapa.category = category;
      }
      let poleras = await getProducts(sender, mapa);
      let cards = [];
      poleras.forEach((polera) => {
        let disc = polera.deal != '0%' ? "(Descuento " + polera.deal + " )" : "";
        cards.push({
          title: polera.name + "  $" + polera.priceDeal + disc,
          image_url: polera.image[0],
          subtitle: polera.categoria,
          buttons: [
            {
              type: "postback",
              title: "Me gusta",
              payload: "me_gusta",
            },
            {
              type: "postback",
              title: "No me gusta",
              payload: "no_me_gusta",
            },
          ],
        });
      });
      await sendGenericMessage(sender, cards);
      await sendTextMessage(sender, '¿Cuál de las poleras le interesa?');
      break;

    case "poleraEspecifica.action": //La polera {polera_especifica} (mostrar informacion - precio de dicha polera) ¿Te gustaría comprar este producto?
     // let paramss1 = parameters.fields;
      
      const size1 = parameters.fields.talla.stringValue;
      const cat1 = parameters.fields.categoriaPolera.stringValue;
      const color1 = parameters.fields.color.stringValue;
     // let category1 = await Category.findOne({ name: cat1 });
      var poleras1 = await getProductsEsp(sender, color1, size1, cat1.toUpperCase());
      var card1 = [];
      poleras1.forEach((polera1) => {
        let disc = polera1.deal != '0%' ? "(Descuento " + polera1.deal + " )" : "";
        card1.push({
          title: polera1.name + "  $" + polera1.priceDeal + disc,
          image_url: polera1.image[0],
          subtitle: polera1.categoria,
          buttons: [
            {
              type: "postback",
              title: "Me gusta",
              payload: "me_gusta",
            },
            {
              type: "postback",
              title: "No me gusta",
              payload: "no_me_gusta",
            },
          ],
        });
      });
      await sendGenericMessage(sender, card1);
      await sendTextMessage(sender, '¿Te gustaría comprar este producto?');
      break;
      
      async function getProductsEsp(facebookId, colorP, tallaP, catName) {
        var busq = '';
        if(colorP && tallaP){
          busq = colorP + ' talla ' + tallaP ;
        }else{
          if (colorP){
            busq = colorP;
          }
          if(tallaP){
            busq = tallaP;
          }
        }
        var busq1 = ` /${busq}/ `

        let visit1 = await getCurrentVisit(facebookId);
        let categoriaPE = await Category.find({name: catName}).limit(1);
        let ofertasR1 = await ofertasF();
        let ofert1 = ofertasR1[0];
        var dcto12 = String(ofert1.discount) + '%';
        var dcto1 = 1 - (ofert1.discount / 100);
        let categoriaPEE = categoriaPE[0];
        console.log("*******************************busqueda********************: ", busq1);
        console.log("*******************************color********************: ", colorP);
        console.log("*******************************talla********************: ", tallaP);

        const dataDB = await Product.find({category:categoriaPEE._id, $text:{$search: ` /${busq}/ `}}); //db.content.find({$text:{$search:"dog"}})
        var productosOf = [];
        console.log("***************************************************: , productos");
        console.log(dataDB);
        for (var i = 0; i < dataDB.length; i++) {
          prod = dataDB[i];
          const descuento = await Discount.findOne({ deal: ofert1._id, product: prod._id });
          let imagenes = await imagenesF(prod._id);
          var nameCat = await categoriaNombreF(prod.category);
          if (visit1) {
            let query = new Query({ visit1, product: prod._id });
            try {
              await query.save();
              console.log('new query', query);
            } catch (err) {
              console.log(err);
            }
          }
      
          if (descuento) {
            let prodDcto = prod.price * dcto1;
            productosOf.push({
              "name": prod.name,
              "description": prod.description,
              "deal": dcto12,
              "price": prod.price,
              "priceDeal": prodDcto,
              "categoria": nameCat,
              "image": imagenes,
            });
          } else {
            productosOf.push({
              "name": prod.name,
              "description": prod.description,
              "deal": '0%',
              "price": prod.price,
              "priceDeal": prod.price,
              "categoria": nameCat,
              "image": imagenes,
            });
          }
        }
      
        return productosOf;
      }












    

    case "precio.action": //{precio_poleras} ¿Cual polera le interesa?


      break;

    case "puntuacion.action": //Gracias por tu valoración, nos ayuda a seguir mejorando. ¡Que tenga un buen dia!
      var score = parameters.fields.puntuacion.stringValue;
      await editVisit(sender, { score, isClosed: true });
      handleMessages(messages, sender);
      break;

    case "respuestaDatos.action": //¡Tu experiencia es importante para nosotros!, ¿Podrías darnos una puntuación en del 1 al 5, de como te pareció la atención?
      var paramsxx = parameters.fields;
      var name = paramsxx.name.stringValue;
      var phone = paramsxx.phone.stringValue;
      var email = paramsxx.email.stringValue;
      var mapx = {};
      if (name) {
        mapx.name = name;
      }
      if (phone) {
        mapx.phone = phone;
      }
      if (email) {
        mapx.email = email;
      }
      await editClient(sender, mapx);
      await editVisit(sender, mapx);
      handleMessages(messages, sender);
      break;


    default:
      // break;
      //unhandled action, just send back the text
      handleMessages(messages, sender);
  }
}

async function handleMessage(message, sender) {
  console.log('handelMessage');
  switch (message.message) {
    case "text": //text
      for (const text of message.text.text) {
        console.log(text);
        if (text !== "") {
          await sendTextMessage(sender, text);
        }
      }
      break;
    case "quickReplies": //quick replies
      let replies = [];
      message.quickReplies.quickReplies.forEach((text) => {
        let reply = {
          content_type: "text",
          title: text,
          payload: text,
        };
        replies.push(reply);
      });
      sendQuickReply(sender, message.quickReplies.title, replies);
      break;
    case "image": //image
      sendImageMessage(sender, message.image.imageUri);
      break;
    case "payload":
      let desestructPayload = structProtoToJson(message.payload);
      var messageData = {
        recipient: {
          id: sender,
        },
        message: desestructPayload.facebook,
      };
      callSendAPI(messageData);
      break;
  }
}

async function sendGenericMessage(recipientId, elements) {
  var messageData = {
    recipient: {
      id: recipientId,
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: elements,
        },
      },
    },
  };

  await callSendAPI(messageData);
}


async function handleMessages(messages, sender) {
  console.log('handleMesagesss');
  try {
    let i = 0;
    while (i < messages.length) {
      switch (messages[i].message) {
        case "text":
          await handleMessage(messages[i], sender);
          break;
        case "image":
          await handleMessage(messages[i], sender);
          break;
        case "quickReplies":
          await handleMessage(messages[i], sender);
          break;
        default:
          break;
      }
      i += 1;
    }
  } catch (error) {
    console.log(error);
  }
}

async function sendToDialogFlow(senderId, messageText) {
  sendTypingOn(senderId);
  try {
    let result;
    setSessionAndUser(senderId);
    let session = sessionIds.get(senderId);
    result = await dialogflow.sendToDialogFlow(
      messageText,
      session,
      "FACEBOOK"
    );
    handleDialogFlowResponse(senderId, result);
  } catch (error) {
    console.log("salio mal en sendToDialogflow...", error);
  }
}

function handleDialogFlowResponse(sender, response) {
  let responseText = response.fulfillmentMessages.fulfillmentText;

  let messages = response.fulfillmentMessages;
  let action = response.action;
  let contexts = response.outputContexts;
  let parameters = response.parameters;

  sendTypingOff(sender);
  console.log("handeling");

  if (isDefined(action)) {
    handleDialogFlowAction(sender, action, messages, contexts, parameters);
  } else if (isDefined(messages)) {
    handleMessages(messages, sender);
  } else if (responseText == "" && !isDefined(action)) {
    sendTextMessage(
      sender,
      "I'm not sure what you want. Can you be more specific?"
    );
  } else if (isDefined(responseText)) {
    sendTextMessage(sender, responseText);
  }
}
async function getUserData(senderId) {
  console.log("consiguiendo datos del usuario");
  let access_token = process.env.PAGE_ACCESS_TOKEN;
  try {
    let userData = await axios.get(
      "https://graph.facebook.com/v7.0/" + senderId,
      {
        params: {
          access_token,
        },
      }
    );
    return userData.data;
  } catch (err) {
    console.log("algo salio mal en axios getUserData: ", err);
    return {
      first_name: "",
      last_name: "",
      profile_pic: "",
    };
  }
}

async function sendTextMessage(recipientId, text) {
  if (text.includes("{first_name}") || text.includes("{last_name}")) {
    let userData = await getUserData(recipientId);
    text = text
      .replace("{first_name}", userData.first_name)
      .replace("{last_name}", userData.last_name);
  }
  console.log('text nuevo ==> ', text);
  var messageData = {
    recipient: {
      id: recipientId,
    },
    message: {
      text: text,
    },
  };
  callSendAPI(messageData);
}

async function sendCategories(recipientId) {
  let categories = await Category.find();
  let text = "";
  categories.forEach(element => {
    text += element.name + "\n";
  });
  text += " ¿Qué tipo de polera le interesa? ";
  var messageData = {
    recipient: {
      id: recipientId,
    },
    message: {
      text: text,
    },
  };
  callSendAPI(messageData);
}

async function sendWelcomeMessage(recipientId, text) {
  if (text.includes("[x]")) {
    let userData = await getUserData(recipientId);
    text = text
      .replace("[x]", userData.first_name);
  }
  var messageData = {
    recipient: {
      id: recipientId,
    },
    message: {
      text: text,
    },
  };
  callSendAPI(messageData);
}

/*
 * Send an image using the Send API.
 *
 */
function sendImageMessage(recipientId, imageUrl) {
  var messageData = {
    recipient: {
      id: recipientId,
    },
    message: {
      attachment: {
        type: "image",
        payload: {
          url: imageUrl,
        },
      },
    },
  };

  callSendAPI(messageData);
}


/*
 * Send a message with Quick Reply buttons.
 *
 */
function sendQuickReply(recipientId, text, replies, metadata) {
  var messageData = {
    recipient: {
      id: recipientId,
    },
    message: {
      text: text,
      metadata: isDefined(metadata) ? metadata : "",
      quick_replies: replies,
    },
  };

  callSendAPI(messageData);
}







// Handles messages events
function handleMessagex(sender_psid, received_message) {
  let response;

  // Checks if the message contains text
  if (received_message.text) {
    // Create the payload for a basic text message, which
    // will be added to the body of our request to the Send API
    response = {
      "text": `Enviaste el mensaje: "${received_message.text}".`
    }
  } else if (received_message.attachments) {
    // Get the URL of the message attachment
    let attachment_url = received_message.attachments[0].payload.url;
    response = {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": [{
            "title": "Is this the right picture?",
            "subtitle": "Tap a button to answer.",
            "image_url": attachment_url,
            "buttons": [
              {
                "type": "postback",
                "title": "Yes!",
                "payload": "yes",
              },
              {
                "type": "postback",
                "title": "No!",
                "payload": "no",
              }
            ],
          }]
        }
      }
    }
  }

  // Send the response message
  callSendAPI(sender_psid, response);
}

async function handleMessage(message, sender) {
  console.log('Handle Message==>', message.message);
  switch (message.message) {
    case "text": //text
      for (const text of message.text.text) {
        if (text !== "") {
          await sendTextMessage(sender, text);
        }
      }
      break;
    case "quickReplies": //quick replies
      let replies = [];
      message.quickReplies.quickReplies.forEach((text) => {
        let reply = {
          content_type: "text",
          title: text,
          payload: text,
        };
        replies.push(reply);
      });
      sendQuickReply(sender, message.quickReplies.title, replies);
      break;
    case "image": //image
      sendImageMessage(sender, message.image.imageUri);
      break;
    case "payload":

      let desestructPayload = structProtoToJson(message.payload);
      var messageData = {
        recipient: {
          id: sender,
        },
        message: desestructPayload.facebook,
      };
      callSendAPI(messageData);
      break;
  }
}


// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {
  let response;

  // Get the payload for the postback
  let payload = received_postback.payload;

  // Set the response based on the postback payload
  if (payload === 'yes') {
    response = { "text": "Gracias!" }
  } else if (payload === 'no') {
    response = { "text": "Oops, intenta de nuevo." }
  }
  // Send the message to acknowledge the postback
  callSendAPI(sender_psid, response);
}

// Sends response messages via the Send API
function callSendAPI(messageData) {
  // Send the HTTP request to the Messenger Platform
  request({
    uri: "https://graph.facebook.com/v7.0/me/messages",
    qs: {
      access_token: process.env.PAGE_ACCESS_TOKEN,
    },
    method: "POST",
    json: messageData,
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
      console.error("Unable to send message:" + err);
    }
  });
}


/*
 * Turn typing indicator on
 *
 */
function sendTypingOn(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId,
    },
    sender_action: "typing_on",
  };

  callSendAPI(messageData);
}

/*
 * Turn typing indicator off
 *
 */
function sendTypingOff(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId,
    },
    sender_action: "typing_off",
  };

  callSendAPI(messageData);
}

function isDefined(obj) {
  if (typeof obj == "undefined") {
    return false;
  }

  if (!obj) {
    return false;
  }

  return obj != null;
}



//todos los productos existentes
async function getProducts(facebookId, req = {}) {
  let visit = await getCurrentVisit(facebookId);
  let ofertasR = await ofertasF();
  let ofert = ofertasR[0];
  var dcto1 = String(ofert.discount) + '%';
  var dcto = 1 - (ofert.discount / 100);
  const dataDB = await Product.find(req); //todos los productos
  var productosOf = [];

  for (var i = 0; i < dataDB.length; i++) {
    prod = dataDB[i];
    const descuento = await Discount.findOne({ deal: ofert._id, product: prod._id });
    let imagenes = await imagenesF(prod._id);
    var nameCat = await categoriaNombreF(prod.category);
    if (visit) {
      let query = new Query({ visit, product: prod._id });
      try {
        await query.save();
        console.log('new query', query);
      } catch (err) {
        console.log(err);
      }
    }

    if (descuento) {
      let prodDcto = prod.price * dcto;
      productosOf.push({
        "name": prod.name,
        "description": prod.description,
        "deal": dcto1,
        "price": prod.price,
        "priceDeal": prodDcto,
        "categoria": nameCat,
        "image": imagenes,
      });
    } else {
      productosOf.push({
        "name": prod.name,
        "description": prod.description,
        "deal": '0%',
        "price": prod.price,
        "priceDeal": prod.price,
        "categoria": nameCat,
        "image": imagenes,
      });
    }
  }

  return productosOf;
}

async function getProductsFromDeal(facebookId, req = {}) {
  let visit = await getCurrentVisit(facebookId);
  let ofertasR = await ofertasF();
  let ofert = ofertasR[0];
  var dcto1 = String(ofert.discount) + '%';
  var dcto = 1 - (ofert.discount / 100);
  const dataDB = await Product.find(req); //todos los productos
  var productosOf = [];

  for (var i = 0; i < dataDB.length; i++) {
    prod = dataDB[i];
    const descuento = await Discount.findOne({ deal: ofert._id, product: prod._id });
    let imagenes = await imagenesF(prod._id);
    var nameCat = await categoriaNombreF(prod.category);
    if (visit) {
      let query = new Query({ visit, product: prod._id });
      try {
        await query.save();
        console.log('new query', query);
      } catch (err) {
        console.log(err);
      }
    }
    if (descuento) {
      let prodDcto = prod.price * dcto;
      productosOf.push({
        "name": prod.name,
        "description": prod.description,
        "deal": dcto1,
        "price": prod.price,
        "priceDeal": prodDcto,
        "categoria": nameCat,
        "image": imagenes,
      });
    }
  }

  return productosOf;
}


async function productosF() {
  const dataDB = await Product.find();
  var productos = [];

  for (var i = 0; i < dataDB.length; i++) {
    prod = dataDB[i];
    var nameCat = await categoriaNombreF(prod.category);
    imagenes = await imagenesF(prod._id);
    productos.push({
      "name": prod.name,
      "description": prod.description,
      "price": prod.price,
      "categoria": nameCat,
      "image": imagenes,
    });
  }

  return productos;
}

async function productosCategoryF(categoryP) {
  const dataDB = await Product.find().limit(10);
  return dataDB;
}

//todas las categorias
async function categoriasF() {
  const dataDB = await Category.find();
  return dataDB;
}

//categoria especifica
async function categoriaNombreF(categoriaP) {
  const dataDB = await Category.find({ _id: categoriaP });
  var cat = dataDB[0];
  var nameCat = cat.name;
  return nameCat;
}

//todas las categorias
async function categoriasF(nameC) {
  const dataDB = await Category.find({ name: nameC });
  return dataDB;
}


async function ofertasF() {
  const dataDB = await Deal.find().sort({ $natural: -1 }).limit(1);
  return dataDB;
}


async function imagenesF(id_prod) {
  const dataDB = await Image.find({ product: id_prod });
  let imagenes = [];
  dataDB.forEach((imagen) => {
    imagenes.push(imagen.url);
  });

  return imagenes;
}


module.exports = {
  postWebHook,
  getWebHook
}