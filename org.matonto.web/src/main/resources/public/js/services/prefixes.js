/*-
 * #%L
 * org.matonto.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
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
         * `prefixes` is a service that simply provides a series of common IRI 
         * strings.
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
        self.data = 'http://matonto.org/data/';
        self.delim = 'http://matonto.org/ontologies/delimited#';
        self.mappings = 'http://matonto.org/mappings/';
        self.catalog = 'http://matonto.org/ontologies/catalog#';
        self.foaf = 'http://xmlns.com/foaf/0.1/';
        self.skos = 'http://www.w3.org/2004/02/skos/core#';
        self.ontologyState = 'http://matonto.org/ontologies/state#';
        self.dataset = 'http://matonto.org/ontologies/dataset#';
        self.ontologyEditor = 'http://matonto.org/ontologies/ontology-editor#';
    }
})();
