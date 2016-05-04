(function() {
    'use strict';

    angular
        .module('prefixes', [])
        .service('prefixes', prefixes);

    function prefixes() {
        var self = this;
        self.rdfs = 'http://www.w3.org/2000/01/rdf-schema#';
        self.rdf = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
        self.owl = 'http://www.w3.org/2002/07/owl#';
        self.dc = 'http://purl.org/dc/elements/1.1/';
        self.xsd = 'http://www.w3.org/2001/XMLSchema#';
        self.data = 'http://matonto.org/data/';
        self.dataDelim = self.data + 'delimited#';
        self.delim = 'http://matonto.org/ontologies/delimited/';
        self.mappings = 'http://matonto.org/mappings/';
        self.foaf = 'http://xmlns.com/foaf/0.1/';
    }
})();