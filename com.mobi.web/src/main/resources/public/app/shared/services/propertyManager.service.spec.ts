/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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

import { TestBed } from '@angular/core/testing';

import { DC, DCTERMS, OWL, RDF, RDFS, SKOS, XSD } from '../../prefixes';
import { PropertyManagerService } from './propertyManager.service';

describe('Property Manager service', function() {
    let service: PropertyManagerService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ ],
            providers: [
                PropertyManagerService,
            ]
        });

        service = TestBed.inject(PropertyManagerService);
    });

    describe('should initialize with the correct value for', function() {
        it('defaultAnnotations', function() {
            [
                `${RDFS}comment`,
                `${RDFS}label`,
                `${RDFS}seeAlso`,
                `${RDFS}isDefinedBy`,
                `${DCTERMS}description`,
                `${DCTERMS}title`,
                `${DCTERMS}contributor`,
                `${DC}description`,
                `${DC}title`,
                `${DC}contributor`,
            ].forEach(str => {
                expect(service.defaultAnnotations).toContain(str);
            });
        });
        it('owlAnnotations', function() {
            expect(service.owlAnnotations).toEqual([`${OWL}deprecated`, `${OWL}versionInfo`]);
        });
        it('skosAnnotations', function() {
            expect(service.skosAnnotations).toEqual([
                `${SKOS}altLabel`,
                `${SKOS}changeNote`,
                `${SKOS}definition`,
                `${SKOS}editorialNote`,
                `${SKOS}example`,
                `${SKOS}hiddenLabel`,
                `${SKOS}historyNote`,
                `${SKOS}note`,
                `${SKOS}prefLabel`,
                `${SKOS}scopeNote`
            ]);
        });
        it('defaultDatatypes', function() {
            expect(service.defaultDatatypes).toEqual([
                `${XSD}anyURI`,
                `${XSD}boolean`,
                `${XSD}byte`,
                `${XSD}date`,
                `${XSD}dateTime`,
                `${XSD}decimal`,
                `${XSD}double`,
                `${XSD}float`,
                `${XSD}int`,
                `${XSD}integer`,
                `${XSD}language`,
                `${XSD}long`,
                `${XSD}string`,
                `${RDF}langString`
            ]);
        });
        it('ontologyProperties', function() {
            expect(service.ontologyProperties).toEqual([
                `${OWL}priorVersion`,
                `${OWL}backwardCompatibleWith`,
                `${OWL}incompatibleWith`,
                `${OWL}versionIRI`
            ]);
        });
        it('conceptSchemeRelationshipList', function() {
            expect(service.conceptSchemeRelationshipList).toEqual([
                `${SKOS}topConceptOf`,
                `${SKOS}inScheme`
            ]);
        });
        it('conceptRelationshipList', function() {
            expect(service.conceptRelationshipList).toEqual([
                `${SKOS}broaderTransitive`,
                `${SKOS}broader`,
                `${SKOS}broadMatch`,
                `${SKOS}narrowerTransitive`,
                `${SKOS}narrower`,
                `${SKOS}narrowMatch`,
                `${SKOS}related`,
                `${SKOS}relatedMatch`,
                `${SKOS}mappingRelation`,
                `${SKOS}closeMatch`,
                `${SKOS}exactMatch`
            ]);
        });
        it('schemeRelationshipList', function() {
            expect(service.schemeRelationshipList).toEqual([`${SKOS}hasTopConcept`]);
        });
        it('classAxiomList', function() {
            expect(service.classAxiomList).toEqual([
                {iri: `${RDFS}subClassOf`, valuesKey: 'classes'},
                {iri: `${OWL}disjointWith`, valuesKey: 'classes'},
                {iri: `${OWL}equivalentClass`, valuesKey: 'classes'}
            ]);
        });
        it('datatypeAxiomList', function() {
            expect(service.datatypeAxiomList).toEqual([
                {iri: `${RDFS}domain`, valuesKey: 'classes'},
                {iri: `${RDFS}range`, valuesKey: 'dataPropertyRange'},
                {iri: `${OWL}equivalentProperty`, valuesKey: 'dataProperties'},
                {iri: `${RDFS}subPropertyOf`, valuesKey: 'dataProperties'},
                {iri: `${OWL}disjointWith`, valuesKey: 'dataProperties'}
            ]);
        });
        it('objectAxiomList', function() {
            expect(service.objectAxiomList).toEqual([
                {iri: `${RDFS}domain`, valuesKey: 'classes'},
                {iri: `${RDFS}range`, valuesKey: 'classes'},
                {iri: `${OWL}equivalentProperty`, valuesKey: 'objectProperties'},
                {iri: `${RDFS}subPropertyOf`, valuesKey: 'objectProperties'},
                {iri: `${OWL}inverseOf`, valuesKey: 'objectProperties'},
                {iri: `${OWL}disjointWith`, valuesKey: 'objectProperties'}
            ]);
        });
    });
    describe('should remove a property value from an entity', function() {
        let prop;
        let entity;
        beforeEach(function() {
            prop = 'prop';
            entity = {};
            entity[prop] = [{}];
        });
        it('if it is the last value', function() {
            service.remove(entity, prop, 0);
            expect(entity[prop]).toBeUndefined();
        });
        it('if there are more values', function() {
            entity[prop].push({});
            service.remove(entity, prop, 0);
            expect(entity[prop]).toEqual([{}]);
        });
    });
    describe('should add a property value', function() {
        let prop;
        let entity;
        let newValue;
        beforeEach(function() {
            prop = 'prop';
            entity = {};
            newValue = {
                '@value': 'value'
            };
        });
        it('unless the property is undefined', function() {
            expect(service.addValue(entity, undefined, newValue['@value'],  newValue['@type'], newValue['@language'])).toEqual(false);
            expect(entity).toEqual({});
        });
        it('unless the value already exists', function() {
            const existingValue = {'@value': 'existing'};
            entity[prop] = [existingValue];
            expect(service.addValue(entity, prop, existingValue['@value'],  newValue['@type'], newValue['@language'])).toEqual(false);
            expect(entity[prop]).toEqual([existingValue]);
        });
        it('with a language and type', function() {
            newValue['@type'] = 'type';
            newValue['@language'] = 'lang';
            expect(service.addValue(entity, prop, newValue['@value'], newValue['@type'], newValue['@language'])).toEqual(true);
            expect(entity[prop]).toEqual([newValue]);
        });
        it('without a language and type', function() {
            expect(service.addValue(entity, prop, newValue['@value'],  newValue['@type'], newValue['@language'])).toEqual(true);
            expect(entity[prop]).toEqual([newValue]);
        });
    });
    describe('should add a property ID value', function() {
        let prop;
        let entity;
        let newValue;
        beforeEach(function() {
            prop = 'prop';
            entity = {};
            newValue = {
                '@id': 'id'
            };
        });
        it('unless the property is undefined', function() {
            expect(service.addId(entity, undefined, newValue['@id'])).toEqual(false);
            expect(entity).toEqual({});
        });
        it('unless the value already exists', function() {
            const existingValue = {'@id': 'existing'};
            entity[prop] = [existingValue];
            expect(service.addId(entity, prop, existingValue['@id'])).toEqual(false);
            expect(entity[prop]).toEqual([existingValue]);
        });
        it('successfully', function() {
            expect(service.addId(entity, prop, newValue['@id'])).toEqual(true);
            expect(entity[prop]).toEqual([newValue]);
        });
    });
    describe('should edit a property value', function() {
        let prop;
        let entity;
        let newValue;
        let existingValue;
        beforeEach(function() {
            prop = 'prop';
            entity = {};
            newValue = {
                '@value': 'value'
            };
            existingValue = {
                '@value': 'existing',
                '@type': 'existing',
                '@language': 'existing'
            };
            entity[prop] = [existingValue];
        });
        it('unless the property is undefined', function() {
            expect(service.editValue(entity, undefined, 0, newValue['@value'],  existingValue['@type'], existingValue['@language'])).toEqual(false);
            expect(entity[prop]).toEqual([existingValue]);
        });
        it('unless there is no value at the specified index', function() {
            expect(service.editValue(entity, prop, 10, newValue['@value'],  existingValue['@type'], existingValue['@language'])).toEqual(false);
            expect(entity[prop]).toEqual([existingValue]);
        });
        it('unless the new value already exists', function() {
            entity[prop].push(newValue);
            expect(service.editValue(entity, prop, 0, newValue['@value'], newValue['@type'], newValue['@language'])).toEqual(false);
            expect(entity[prop]).toEqual([existingValue, newValue]);
        });
        it('with a language and type', function() {
            newValue['@type'] = 'type';
            newValue['@language'] = 'lang';
            expect(service.editValue(entity, prop, 0, newValue['@value'], newValue['@type'], newValue['@language'])).toEqual(true);
            expect(entity[prop]).toEqual([{'@value': 'value', '@language': 'lang'}]);
        });
        it('without a language and type', function() {
            expect(service.editValue(entity, prop, 0, newValue['@value'], undefined, undefined)).toEqual(true);
            expect(entity[prop]).toEqual([newValue]);
        });
    });
    describe('should edit a property ID value', function() {
        let prop;
        let entity;
        let newValue;
        let existingValue;
        beforeEach(function() {
            prop = 'prop';
            entity = {};
            newValue = {
                '@id': 'id'
            };
            existingValue = {
                '@id': 'existing'
            };
            entity[prop] = [existingValue];
        });
        it('unless the property is undefined', function() {
            expect(service.editId(entity, undefined, 0, newValue['@id'])).toEqual(false);
            expect(entity[prop]).toEqual([existingValue]);
        });
        it('unless there is no value at the specified index', function() {
            expect(service.editId(entity, prop, 10, newValue['@id'])).toEqual(false);
            expect(entity[prop]).toEqual([existingValue]);
        });
        it('unless the new value already exists', function() {
            entity[prop].push(newValue);
            expect(service.editId(entity, prop, 0, newValue['@id'])).toEqual(false);
            expect(entity[prop]).toEqual([existingValue, newValue]);
        });
        it('successfully', function() {
            expect(service.editId(entity, prop, 0, newValue['@id'])).toEqual(true);
            expect(entity[prop]).toEqual([newValue]);
        });
    });
});
