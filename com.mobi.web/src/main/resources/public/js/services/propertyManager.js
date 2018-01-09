/*-
 * #%L
 * com.mobi.web
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
        .module('propertyManager', [])
        .service('propertyManagerService', propertyManagerService);

        propertyManagerService.$inject = ['prefixes'];

        function propertyManagerService(prefixes) {
            var self = this;

            var rdfsAnnotations = _.map(['comment', 'label', 'seeAlso', 'isDefinedBy'], item => prefixes.rdfs + item);
            var dcAnnotations = _.map(['description', 'title'], item => prefixes.dcterms + item);
            /**
             * @ngdoc property
             * @name defaultAnnotations
             * @propertyOf propertyManager.service:propertyManagerService
             * @type {string[]}
             *
             * @description
             * `defaultAnnotations` holds an array of annotations that are available by default.
             */
            self.defaultAnnotations = _.concat(rdfsAnnotations, dcAnnotations);
            /**
             * @ngdoc property
             * @name owlAnnotations
             * @propertyOf propertyManager.service:propertyManagerService
             * @type {string[]}
             *
             * @description
             * `owlAnnotations` holds an array of OWL annotations.
             */
            self.owlAnnotations = [prefixes.owl + 'deprecated'];
            /**
             * @ngdoc property
             * @name skosAnnotations
             * @propertyOf propertyManager.service:propertyManagerService
             * @type {string[]}
             *
             * @description
             * `skosAnnotations` holds an array of SKOS annotations.
             */
            self.skosAnnotations = _.map(['altLabel', 'changeNote', 'definition', 'editorialNote', 'example', 'hiddenLabel', 'historyNote', 'note', 'prefLabel', 'scopeNote'], item => prefixes.skos + item);

            var xsdDatatypes = _.map(['anyURI', 'boolean', 'byte', 'dateTime', 'decimal', 'double', 'float', 'int', 'integer', 'language', 'long', 'string'], item => prefixes.xsd + item);
            var rdfDatatypes = _.map(['langString'], item => prefixes.rdf + item);
            /**
             * @ngdoc property
             * @name defaultDatatypes
             * @propertyOf propertyManager.service:propertyManagerService
             * @type {string[]}
             *
             * @description
             * `defaultDatatypes` holds an array of datatypes that are available by default.
             */
            self.defaultDatatypes = _.concat(xsdDatatypes, rdfDatatypes);
            /**
             * @ngdoc property
             * @name ontologyProperties
             * @propertyOf propertyManager.service:propertyManagerService
             * @type {string[]}
             *
             * @description
             * `ontologyProperties` holds an array of the property types available to be added to the ontology entity
             * within an ontology.
             */
            self.ontologyProperties = _.map(['priorVersion', 'backwardCompatibleWith', 'incompatibleWith'], item => prefixes.owl + item);
            /**
             * @ngdoc property
             * @name ontologyProperties
             * @propertyOf propertyManager.service:propertyManagerService
             * @type {string[]}
             *
             * @description
             * `conceptSchemeRelationshipList` holds an array of the relationships that skos:Concepts can have with
             * skos:ConceptSchemes.
             */
            self.conceptSchemeRelationshipList = _.map(['topConceptOf', 'inScheme'], item => prefixes.skos + item);
            /**
             * @ngdoc property
             * @name conceptRelationshipList
             * @propertyOf propertyManager.service:propertyManagerService
             * @type {string[]}
             *
             * @description
             * `conceptRelationshipList` holds an array of the relationships that skos:Concepts can have with other
             * skos:Concepts.
             */
            self.conceptRelationshipList = _.map(['broaderTransitive', 'broader', 'broadMatch', 'narrowerTransitive', 'narrower', 'narrowMatch', 'related', 'relatedMatch', 'mappingRelation', 'closeMatch', 'exactMatch'], item => prefixes.skos + item);
            /**
             * @ngdoc property
             * @name schemeRelationshipList
             * @propertyOf propertyManager.service:propertyManagerService
             * @type {string[]}
             *
             * @description
             * `schemeRelationshipList` holds an array of the relationships that skos:ConceptSchemes can have with other
             * entities.
             */
            self.schemeRelationshipList = [prefixes.skos + 'hasTopConcept'];
            /**
             * @ngdoc property
             * @name classAxiomList
             * @propertyOf propertyManager.service:propertyManagerService
             * @type {Object[]}
             *
             * @description
             * `classAxiomList` holds an array of objects representing supported axioms on owl:Classes with the
             * key name for the list of values from a {@link ontologyState.service:ontologyStateService list item}.
             */
            self.classAxiomList = [
                {iri: prefixes.rdfs + 'subClassOf', valuesKey: 'classes'},
                {iri: prefixes.owl + 'disjointWith', valuesKey: 'classes'},
                {iri: prefixes.owl + 'equivalentClass', valuesKey: 'classes'}
            ];
            /**
             * @ngdoc property
             * @name datatypeAxiomList
             * @propertyOf propertyManager.service:propertyManagerService
             * @type {Object[]}
             *
             * @description
             * `datatypeAxiomList` holds an array of objects representing supported axioms on owl:DatatypeProperties
             * with the key name for the list of values from a
             * {@link ontologyState.service:ontologyStateService list item}.
             */
            self.datatypeAxiomList = [
                {iri: prefixes.rdfs + 'domain', valuesKey: 'classes'},
                {iri: prefixes.rdfs + 'range', valuesKey: 'dataPropertyRange'},
                {iri: prefixes.owl + 'equivalentProperty', valuesKey: 'dataProperties'},
                {iri: prefixes.rdfs + 'subPropertyOf', valuesKey: 'dataProperties'},
                {iri: prefixes.owl + 'disjointWith', valuesKey: 'dataProperties'}
            ];
            /**
             * @ngdoc property
             * @name objectAxiomList
             * @propertyOf propertyManager.service:propertyManagerService
             * @type {Object[]}
             *
             * @description
             * `objectAxiomList` holds an array of objects representing supported axioms on owl:ObjectProperties
             * with the key name for the list of values from a
             * {@link ontologyState.service:ontologyStateService list item}.
             */
            self.objectAxiomList = [
                {iri: prefixes.rdfs + 'domain', valuesKey: 'classes'},
                {iri: prefixes.rdfs + 'range', valuesKey: 'classes'},
                {iri: prefixes.owl + 'equivalentProperty', valuesKey: 'objectProperties'},
                {iri: prefixes.rdfs + 'subPropertyOf', valuesKey: 'objectProperties'},
                {iri: prefixes.owl + 'inverseOf', valuesKey: 'objectProperties'},
                {iri: prefixes.owl + 'disjointWith', valuesKey: 'objectProperties'}
            ];

            self.remove = function(entity, key, index) {
                _.pullAt(entity[key], index);
                if (!entity[key].length) {
                    delete entity[key];
                }
            }
            self.add = function(entity, prop, value, type, language) {
                if (prop) {
                    var annotation = {'@value': value};
                    if (type) {
                        annotation['@type'] = type;
                    }
                    if (language) {
                        annotation['@language'] = language;
                    }
                    if (_.has(entity, prop)) {
                        entity[prop].push(annotation);
                    } else {
                        entity[prop] = [annotation];
                    }
                }
            }
            self.edit = function(entity, prop, value, index, type, language) {
                if (prop) {
                    var annotation = entity[prop][index];
                    annotation['@value'] = value;
                    if (type) {
                        annotation['@type'] = type;
                    } else {
                        _.unset(annotation, '@type');
                    }
                    if (language) {
                        annotation['@language'] = language;
                    } else {
                        _.unset(annotation, '@language');
                    }
                }
            }
        }
})();
