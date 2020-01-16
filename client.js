const config = require('./config')

// Load external script with store
const loadExternalScript = (ecwidStoreId, callback) => {
  const script = document.createElement('script')
  script.setAttribute('src', config.scriptUrl)
  script.setAttribute('type', 'text/javascript')
  script.charset = 'utf-8'
  script.async = true
  
  script.onreadystatechange = script.onload = callback
  document.body.appendChild(script)
}

const initMarkeazePixel = () => {
  const appConfig = JSON.parse(Ecwid.getAppPublicConfig(config.appId))

  console.log(appConfig)

  mkz('appKey', appConfig.app_key)
  if (config.debug) mkz('debug', true)
}

const setVisitorInfo = (profile) => {
  if (profile != null) {
    const visitorInfo = {}

    visitorInfo['email'] = profile.email
    visitorInfo['client_id'] = profile.id
    if (profile.billingPerson != null) visitorInfo['full_name'] = profile.billingPerson.name

    mkz('setVisitorInfo', visitorInfo)
  } else {
    mkz('clearVisitorInfo')
  }
}

const trackPageView = (page) => {
  const eventPayload = {}

  if (page.type == 'PRODUCT') {
    eventPayload.offer = {
      variant_id: String(page.productId), // variant_id????????
      name: page.name
    }
  }

  if (page.type == 'CATEGORY') {
    eventPayload.category = {
      uid: String(page.categoryId),
      name: page.name
    }
  }

  mkz('trackPageView', eventPayload)
}

const trackCartUpdate = (cart) => {
  const cartItems = []
  for (i = 0; i < cart.items.length; i++) {
    line_item = cart.items[i]
    if (line_item.product) {
      cartItems.push({
        variant_id:   String(line_item.product.id),
        qnt:          line_item.quantity,
        price:        line_item.product.price,
        name:         line_item.product.name,
        url:          line_item.product.url
      })
    }
  }

  mkz('trackCartUpdate', {items: cartItems})
}

// https://developers.ecwid.com/api-documentation/subscribe-to-events
const init = () => {
  Ecwid.OnAPILoaded.add(() => {
    loadExternalScript(Ecwid.getOwnerId(), initMarkeazePixel)
  })

  Ecwid.OnSetProfile.add((profile) => {
    setVisitorInfo(profile)
  })

  Ecwid.OnPageLoaded.add((page) => {
    trackPageView(page)
  })

  Ecwid.OnCartChanged.add((cart) => {
    // {
    //   orderId: 0
    //   productsQuantity: 5
    //   cartId: 'E62B0DA2-F73D-4781-9F2D-87E879AD5AAE'
    //   weight: 1.66
    //   items: [
    //     {
    //       product: {
    //         price: 3.33
    //         name: 'Apple222'
    //         weight: 0.32
    //         id: 38843905
    //         shortDescription: 'Apple 222 The apple is the pomaceous fruit of the apple tree, species Malus domestica in the rose family Rosaceae. It ...'
    //         sku: '00000'
    //         url: 'http://eqsol.ru/ecwid2.html?~~mode=product&~~id=38843905#!/Apple222/p/38843905/category=10187566'
    //       },
    //       quantity: 3,
    //       options: {
    //         Color: 'Green'
    //         Size: 'Big'
    //       }
    //     }
    //   ]
    // }

    trackCartUpdate(cart)
  })
}

init()
