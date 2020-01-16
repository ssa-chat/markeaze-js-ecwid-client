(function () {

  // Load external script with store
  function loadExternalScript(ecwidStoreId, callback) {
    var script = document.createElement("script");
    script.setAttribute("src", "https://cdn.jsdelivr.net/gh/markeaze/markeaze-js-tracker@latest/dist/mkz.js"); // CONST: latest/stable
    script.setAttribute("type", "text/javascript");
    script.charset = "utf-8";
    script.async = true;
    
    script.onreadystatechange = script.onload = callback;
    document.body.appendChild(script);
  }

  function initMarkeazePixel() {
    var appId = 'markeaze-dev'; // CONST
    var appConfig = JSON.parse(Ecwid.getAppPublicConfig(appId));

    console.log(appConfig);

    mkz('appKey', appConfig.app_key);
    mkz('debug', true);         // CONST
  }

  function setVisitorInfo(profile) {
    if (profile != null) {
      var visitor_info = {};

      visitor_info['email'] = profile.email;
      visitor_info['client_id'] = profile.id;
      if (profile.billingPerson != null) visitor_info['full_name'] = profile.billingPerson.name;

      mkz('setVisitorInfo', visitor_info);
    } else {
      mkz('clearVisitorInfo');
    }
  }

  function trackPageView(page) {
    var eventPayload = {};

    if (page.type == 'PRODUCT') {
      eventPayload.offer = {
        variant_id: String(page.productId), // variant_id????????
        name: page.name
      };
    }

    if (page.type == 'CATEGORY') {
      eventPayload.category = {
        uid: String(page.categoryId),
        name: page.name
      };
    }

    mkz('trackPageView', eventPayload);
  }

  function trackCartUpdate(cart) {
    var cart_items = [];
    for (i = 0; i < cart.items.length; i++) {
      line_item = cart.items[i];
      if (line_item.product) {
        cart_items.push({
          variant_id:   String(line_item.product.id),
          qnt:          line_item.quantity,
          price:        line_item.product.price,
          name:         line_item.product.name,
          url:          line_item.product.url
        });
      }
    }

    mkz('trackCartUpdate', {items: cart_items});
  }

  // https://developers.ecwid.com/api-documentation/subscribe-to-events
  function init() {
    Ecwid.OnAPILoaded.add(function () {
      loadExternalScript(Ecwid.getOwnerId(), initMarkeazePixel);
    });

    Ecwid.OnSetProfile.add(function (profile) {
      setVisitorInfo(profile);
    });

    Ecwid.OnPageLoaded.add(function (page) {
      trackPageView(page);
    });

    Ecwid.OnCartChanged.add(function (cart) {
      // {
      //   orderId: 0
      //   productsQuantity: 5
      //   cartId: "E62B0DA2-F73D-4781-9F2D-87E879AD5AAE"
      //   weight: 1.66
      //   items: [
      //     {
      //       product: {
      //         price: 3.33
      //         name: "Apple222"
      //         weight: 0.32
      //         id: 38843905
      //         shortDescription: "Apple 222 The apple is the pomaceous fruit of the apple tree, species Malus domestica in the rose family Rosaceae. It ..."
      //         sku: "00000"
      //         url: "http://eqsol.ru/ecwid2.html?~~mode=product&~~id=38843905#!/Apple222/p/38843905/category=10187566"
      //       },
      //       quantity: 3,
      //       options: {
      //         Color: "Green"
      //         Size: "Big"
      //       }
      //     }
      //   ]
      // }

      trackCartUpdate(cart);
    });
  }

  init();
})();