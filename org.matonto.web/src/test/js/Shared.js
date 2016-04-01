function injectDirectiveTemplate(basePath) {
    beforeEach(function(done) {
        inject(function($templateCache) {
            var directiveTemplate = null;
            var req = new XMLHttpRequest();
            req.onload = function() {
                directiveTemplate = this.responseText;
                $templateCache.put(basePath, directiveTemplate);
                done();
            }
            // This path is dependent on the source path definied for the 
            // jasmine-maven-plugin in the pom.xml
            req.open('get', 'src/' + basePath);
            req.send();
        });
    });
}