const config = require('./config')

// Load external script with store
const loadExternalScript = (ecwidStoreId, callback) => {
  let script = document.createElement('script')
  script.setAttribute('src', config.scriptUrl)
  script.setAttribute('type', 'text/javascript')
  script.charset = 'utf-8'
  script.async = true
  
  script.onreadystatechange = script.onload = callback
  document.body.appendChild(script)
}

const createMarkeazePixel = () => {
  (function(w,d,c,h) {
    w[c] = w[c] || function() {
        (w[c].q = w[c].q || []
      ).push(arguments)
    }
  })(window, document, 'mkz')
}

const initMarkeazePixel = () => {
  let appConfig = JSON.parse(Ecwid.getAppPublicConfig(config.appId))

  mkz('appKey', appConfig.app_key)
  if (config.debug) mkz('debug', true)
}

const setVisitorInfo = (profile) => {
  if (profile != null) {
    let visitorInfo = {}

    visitorInfo['email'] = profile.email
    visitorInfo['client_id'] = String(profile.id)
    if (profile.billingPerson != null) visitorInfo['full_name'] = profile.billingPerson.name

    mkz('setVisitorInfo', visitorInfo)
  } else {
    mkz('clearVisitorInfo')
  }
}

const trackPageView = (page) => {
  let eventPayload = {}

  if (page.type == 'PRODUCT') {
    eventPayload.offer = {
      variant_id: String(page.productId),
      name: page.name
    }
  }

  if (page.type == 'CATEGORY') {
    // exclude root category
    if (page.categoryId != 0) {
      eventPayload.category = {
        uid: String(page.categoryId),
        name: page.name
      }
    }
  }

  mkz('trackPageView', eventPayload)
}

const trackCartUpdate = (cart) => {
  if (cart == null) return 

  let cartItems = []
  for (i = 0; i < cart.items.length; i++) {
    line_item = cart.items[i]
    if (line_item.product) {
      cartItems.push({
        variant_id:   String(line_item.product.id),
        qnt:          line_item.quantity,
        price:        line_item.product.price,
        name:         getProductName(line_item.product, line_item.options),
        url:          line_item.product.url
      })
    }
  }

  mkz('trackCartUpdate', {items: cartItems})
}

const getProductName = (product, options) => {
  let productName = product.name

  if (options) {
    let opts = []
    for (let [key, value] of Object.entries(options)) {
      opts.push(key + ": " + value)
    }
    
    productName = productName + ' (' + opts.join(', ') + ')'
  }
  
  return productName
}

// https://developers.ecwid.com/api-documentation/subscribe-to-events
const init = () => {
  createMarkeazePixel()

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
    trackCartUpdate(cart)
  })
}

init()
