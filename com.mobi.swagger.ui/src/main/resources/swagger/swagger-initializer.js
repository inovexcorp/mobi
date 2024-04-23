window.onload = function() {
  //<editor-fold desc="Changeable Configuration Block">

  // the following lines will be replaced by docker/configurator, when it runs in a docker-container
  window.ui = SwaggerUIBundle({
    url: window.location.origin + "/swagger-ui/mobi-swagger.yaml",
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset
    ],
    plugins: [
      SwaggerUIBundle.plugins.DownloadUrl,
      {
        statePlugins: {
          spec: {
            wrapActions: {
              updateJsonSpec: function(oriAction, system) {
                return (spec) => {
                  spec.servers = spec.servers.map(server => {return {'url': window.location.origin + server.url }})
                  return oriAction(spec)
                }
              }
            }
          }
        }
      }
    ],
    layout: "StandaloneLayout",
    apisSorter: "alpha",
    operationsSorter: "alpha"
  });

  //</editor-fold>
};
