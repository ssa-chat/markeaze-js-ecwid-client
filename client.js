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

const createXhrObserver = () => {
  const oldSend = XMLHttpRequest.prototype.send
  XMLHttpRequest.prototype.send = function abSend(data) {
    const oldFn = this.onreadystatechange
    this.onreadystatechange = function () {
      if (this.readyState === 4) {
        document.dispatchEvent(new CustomEvent('ajaxComplete', { detail: { xhr: this, data } }))
      }
      if (oldFn) return oldFn.apply(this, arguments)
    };
    return oldSend.apply(this, arguments)
  }
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

const trackSearch = (page) => {
  const params = {
    term: page.keywords
  }
  if (page.searchResults) params.result = page.searchResults
  mkz('trackSearch', params)
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

const updateVisitorInfoFromOrder = (order) => {
  let visitorInfo = {}

  if (typeof order.customer !== 'undefined') {
    visitorInfo['email'] = order.customer.email
    visitorInfo['full_name'] = order.customer.name
  }

  if (typeof order.billingPerson !== 'undefined') {
    visitorInfo['phone'] = order.billingPerson.phone
  }

  if (visitorInfo !== {}) {
    mkz('trackVisitorUpdate', visitorInfo)
  }
}

// https://developers.ecwid.com/api-documentation/subscribe-to-events
const init = () => {
  createMarkeazePixel()
  createXhrObserver()

  Ecwid.OnAPILoaded.add(() => {
    loadExternalScript(Ecwid.getOwnerId(), initMarkeazePixel)
  })

  Ecwid.OnSetProfile.add((profile) => {
    setVisitorInfo(profile)
  })

  Ecwid.OnCartChanged.add((cart) => {
    trackCartUpdate(cart)
  })

  Ecwid.OnOrderPlaced.add((order) => {
    updateVisitorInfoFromOrder(order)
  })

  let searchResults = null

  document.addEventListener('ajaxComplete', (event) => {
    if (!event.detail) return
    const xhr = event.detail.xhr
    const data = event.detail.data
    const text = xhr.responseText
    if (!xhr || !data || !text) return
    if (data.indexOf('searchProducts') === -1 || xhr.responseURL.indexOf('/rpc?') === -1) return
    const res = text.match(/\/\/OK\[([0-9]*)/)
    if (!res) return
    const count = parseInt(res[1])
    searchResults = count > 0 ? (count === 1 ? 'normal' : 'too_many') : 'empty'
  })

  Ecwid.OnPageLoaded.add((page) => {
    // When search mode detected - track only `search` event,
    // without `page_view` events.
    if (page.type == 'SEARCH') {
      // Avoid search tracking on seach results navigation
      if (page.offset == 0) {
        page.searchResults = searchResults
        trackSearch(page)
      }
    } else {
      trackPageView(page)
    }
  })
}

init()
