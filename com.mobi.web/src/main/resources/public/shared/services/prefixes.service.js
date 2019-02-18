(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name prefixes
         *
         * @description
         * The `prefixes` module only provides the `prefixes` service which
         * simply provides standard strings for common IRIs.
         */
        .module('prefixes', [])
        /**
         * @ngdoc service
         * @name prefixes.service:prefixes
         *
         * @description
         * `prefixes` is a service that simply provides a series of common IRI strings.
         */
        .service('prefixes', prefixes);

    function prefixes() {
        var self = this;
        self.rdfs = 'http://www.w3.org/2000/01/rdf-schema#';
        self.rdf = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
        self.owl = 'http://www.w3.org/2002/07/owl#';
        self.dc = 'http://purl.org/dc/elements/1.1/';
        self.dcterms = 'http://purl.org/dc/terms/';
        self.xsd = 'http://www.w3.org/2001/XMLSchema#';
        self.data = 'http://mobi.com/data/';
        self.delim = 'http://mobi.com/ontologies/delimited#';
        self.mappings = 'http://mobi.com/mappings/';
        self.catalog = 'http://mobi.com/ontologies/catalog#';
        self.foaf = 'http://xmlns.com/foaf/0.1/';
        self.skos = 'http://www.w3.org/2004/02/skos/core#';
        self.ontologyState = 'http://mobi.com/ontologies/state#';
        self.dataset = 'http://mobi.com/ontologies/dataset#';
        self.ontologyEditor = 'http://mobi.com/ontologies/ontology-editor#';
        self.prov = 'http://www.w3.org/ns/prov#';
        self.matprov = 'http://mobi.com/ontologies/prov#';
        self.analytic = 'http://mobi.com/ontologies/analytic#';
        self.mergereq = 'http://mobi.com/ontologies/merge-requests#';
        self.policy = 'http://mobi.com/ontologies/policy#';
        self.user = 'http://mobi.com/ontologies/user/management#';
        self.roles = 'http://mobi.com/roles/';
    }
})();
