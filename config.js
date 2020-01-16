const config = {
  staging: {
    debug: true,
    scriptUrl: 'https://cdn.jsdelivr.net/gh/markeaze/markeaze-js-tracker@latest/dist/mkz.js',
    appId: 'markeaze-dev'
  },
  production: {
    debug: false,
    scriptUrl: 'https://cdn.jsdelivr.net/gh/markeaze/markeaze-js-tracker@latest/dist/mkz.js',
    appId: 'markeaze-dev'
  }
}

module.exports = config[process.env.NODE_ENV] || config.staging
