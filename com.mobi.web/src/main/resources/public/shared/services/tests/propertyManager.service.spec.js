describe('Property Manager service', function() {
    var propertyManagerSvc, prefixes;

    beforeEach(function() {
        module('propertyManager');
        mockPrefixes();

        inject(function(propertyManagerService, _prefixes_) {
            propertyManagerSvc = propertyManagerService;
            prefixes = _prefixes_;
        });
    });

    afterEach(function() {
        propertyManagerSvc = null;
        prefixes = null;
    });

    describe('should initialize with the correct value for', function() {
        it('defaultAnnotations', function() {
            expect(propertyManagerSvc.defaultAnnotations).toEqual([
                prefixes.rdfs + 'comment',
                prefixes.rdfs + 'label',
                prefixes.rdfs + 'seeAlso',
                prefixes.rdfs + 'isDefinedBy',
                prefixes.dcterms + 'description',
                prefixes.dcterms + 'title'
            ]);
        });
        it('owlAnnotations', function() {
            expect(propertyManagerSvc.owlAnnotations).toEqual([prefixes.owl + 'deprecated']);
        });
        it('skosAnnotations', function() {
            expect(propertyManagerSvc.skosAnnotations).toEqual([
                prefixes.skos + 'altLabel',
                prefixes.skos + 'changeNote',
                prefixes.skos + 'definition',
                prefixes.skos + 'editorialNote',
                prefixes.skos + 'example',
                prefixes.skos + 'hiddenLabel',
                prefixes.skos + 'historyNote',
                prefixes.skos + 'note',
                prefixes.skos + 'prefLabel',
                prefixes.skos + 'scopeNote'
            ]);
        });
        it('defaultDatatypes', function() {
            expect(propertyManagerSvc.defaultDatatypes).toEqual([
                prefixes.xsd + 'anyURI',
                prefixes.xsd + 'boolean',
                prefixes.xsd + 'byte',
                prefixes.xsd + 'dateTime',
                prefixes.xsd + 'decimal',
                prefixes.xsd + 'double',
                prefixes.xsd + 'float',
                prefixes.xsd + 'int',
                prefixes.xsd + 'integer',
                prefixes.xsd + 'language',
                prefixes.xsd + 'long',
                prefixes.xsd + 'string',
                prefixes.rdf + 'langString'
            ]);
        });
        it('ontologyProperties', function() {
            expect(propertyManagerSvc.ontologyProperties).toEqual([
                prefixes.owl + 'priorVersion',
                prefixes.owl + 'backwardCompatibleWith',
                prefixes.owl + 'incompatibleWith'
            ]);
        });
        it('conceptSchemeRelationshipList', function() {
            expect(propertyManagerSvc.conceptSchemeRelationshipList).toEqual([
                prefixes.skos + 'topConceptOf',
                prefixes.skos + 'inScheme'
            ]);
        });
        it('conceptRelationshipList', function() {
            expect(propertyManagerSvc.conceptRelationshipList).toEqual([
                prefixes.skos + 'broaderTransitive',
                prefixes.skos + 'broader',
                prefixes.skos + 'broadMatch',
                prefixes.skos + 'narrowerTransitive',
                prefixes.skos + 'narrower',
                prefixes.skos + 'narrowMatch',
                prefixes.skos + 'related',
                prefixes.skos + 'relatedMatch',
                prefixes.skos + 'mappingRelation',
                prefixes.skos + 'closeMatch',
                prefixes.skos + 'exactMatch'
            ]);
        });
        it('schemeRelationshipList', function() {
            expect(propertyManagerSvc.schemeRelationshipList).toEqual([prefixes.skos + 'hasTopConcept']);
        });
        it('classAxiomList', function() {
            expect(propertyManagerSvc.classAxiomList).toEqual([
                {iri: prefixes.rdfs + 'subClassOf', valuesKey: 'classes'},
                {iri: prefixes.owl + 'disjointWith', valuesKey: 'classes'},
                {iri: prefixes.owl + 'equivalentClass', valuesKey: 'classes'}
            ]);
        });
        it('datatypeAxiomList', function() {
            expect(propertyManagerSvc.datatypeAxiomList).toEqual([
                {iri: prefixes.rdfs + 'domain', valuesKey: 'classes'},
                {iri: prefixes.rdfs + 'range', valuesKey: 'dataPropertyRange'},
                {iri: prefixes.owl + 'equivalentProperty', valuesKey: 'dataProperties'},
                {iri: prefixes.rdfs + 'subPropertyOf', valuesKey: 'dataProperties'},
                {iri: prefixes.owl + 'disjointWith', valuesKey: 'dataProperties'}
            ]);
        });
        it('objectAxiomList', function() {
            expect(propertyManagerSvc.objectAxiomList).toEqual([
                {iri: prefixes.rdfs + 'domain', valuesKey: 'classes'},
                {iri: prefixes.rdfs + 'range', valuesKey: 'classes'},
                {iri: prefixes.owl + 'equivalentProperty', valuesKey: 'objectProperties'},
                {iri: prefixes.rdfs + 'subPropertyOf', valuesKey: 'objectProperties'},
                {iri: prefixes.owl + 'inverseOf', valuesKey: 'objectProperties'},
                {iri: prefixes.owl + 'disjointWith', valuesKey: 'objectProperties'}
            ]);
        });
    });
    describe('should remove a property value from an entity', function() {
        beforeEach(function() {
            this.prop = 'prop';
            this.entity = {};
            this.entity[this.prop] = [{}];
        });
        it('if it is the last value', function() {
            propertyManagerSvc.remove(this.entity, this.prop, 0);
            expect(this.entity[this.prop]).toBeUndefined();
        });
        it('if there are more values', function() {
            this.entity[this.prop].push({});
            propertyManagerSvc.remove(this.entity, this.prop, 0);
            expect(this.entity[this.prop]).toEqual([{}]);
        });
    });
    describe('should add a property value', function() {
        beforeEach(function() {
            this.prop = 'prop';
            this.entity = {};
            this.newValue = {
                '@value': 'value'
            };
        });
        it('unless the property is undefined', function() {
            expect(propertyManagerSvc.addValue(this.entity, undefined, this.newValue['@value'])).toEqual(false);
            expect(this.entity).toEqual({});
        });
        it('unless the value already exists', function() {
            var existingValue = {'@value': 'existing'};
            this.entity[this.prop] = [existingValue];
            expect(propertyManagerSvc.addValue(this.entity, this.prop, existingValue['@value'])).toEqual(false);
            expect(this.entity[this.prop]).toEqual([existingValue]);
        });
        it('with a language and type', function() {
            this.newValue['@type'] = 'type';
            this.newValue['@language'] = 'lang';
            expect(propertyManagerSvc.addValue(this.entity, this.prop, this.newValue['@value'], this.newValue['@type'], this.newValue['@language'])).toEqual(true);
            expect(this.entity[this.prop]).toEqual([this.newValue]);
        });
        it('without a language and type', function() {
            expect(propertyManagerSvc.addValue(this.entity, this.prop, this.newValue['@value'])).toEqual(true);
            expect(this.entity[this.prop]).toEqual([this.newValue]);
        });
    });
    describe('should add a property ID value', function() {
        beforeEach(function() {
            this.prop = 'prop';
            this.entity = {};
            this.newValue = {
                '@id': 'id'
            };
        });
        it('unless the property is undefined', function() {
            expect(propertyManagerSvc.addId(this.entity, undefined, this.newValue['@id'])).toEqual(false);
            expect(this.entity).toEqual({});
        });
        it('unless the value already exists', function() {
            var existingValue = {'@id': 'existing'};
            this.entity[this.prop] = [existingValue];
            expect(propertyManagerSvc.addId(this.entity, this.prop, existingValue['@id'])).toEqual(false);
            expect(this.entity[this.prop]).toEqual([existingValue]);
        });
        it('successfully', function() {
            expect(propertyManagerSvc.addId(this.entity, this.prop, this.newValue['@id'])).toEqual(true);
            expect(this.entity[this.prop]).toEqual([this.newValue]);
        });
    });
    describe('should edit a property value', function() {
        beforeEach(function() {
            this.prop = 'prop';
            this.entity = {};
            this.newValue = {
                '@value': 'value'
            };
            this.existingValue = {
                '@value': 'existing',
                '@type': 'existing',
                '@language': 'existing'
            };
            this.entity[this.prop] = [this.existingValue];
        });
        it('unless the property is undefined', function() {
            expect(propertyManagerSvc.editValue(this.entity, undefined, 0, this.newValue['@value'])).toEqual(false);
            expect(this.entity[this.prop]).toEqual([this.existingValue]);
        });
        it('unless there is no value at the specified index', function() {
            expect(propertyManagerSvc.editValue(this.entity, this.prop, 10, this.newValue['@value'])).toEqual(false);
            expect(this.entity[this.prop]).toEqual([this.existingValue]);
        });
        it('unless the new value already exists', function() {
            this.entity[this.prop].push(this.newValue);
            expect(propertyManagerSvc.editValue(this.entity, this.prop, 0, this.newValue['@value'])).toEqual(false);
            expect(this.entity[this.prop]).toEqual([this.existingValue, this.newValue]);
        });
        it('with a language and type', function() {
            this.newValue['@type'] = 'type';
            this.newValue['@language'] = 'lang';
            expect(propertyManagerSvc.editValue(this.entity, this.prop, 0, this.newValue['@value'], this.newValue['@type'], this.newValue['@language'])).toEqual(true);
            expect(this.entity[this.prop]).toEqual([this.newValue]);
        });
        it('without a language and type', function() {
            expect(propertyManagerSvc.editValue(this.entity, this.prop, 0, this.newValue['@value'])).toEqual(true);
            expect(this.entity[this.prop]).toEqual([this.newValue]);
        });
    });
    describe('should edit a property ID value', function() {
        beforeEach(function() {
            this.prop = 'prop';
            this.entity = {};
            this.newValue = {
                '@id': 'id'
            };
            this.existingValue = {
                '@id': 'existing'
            };
            this.entity[this.prop] = [this.existingValue];
        });
        it('unless the property is undefined', function() {
            expect(propertyManagerSvc.editId(this.entity, undefined, 0, this.newValue['@id'])).toEqual(false);
            expect(this.entity[this.prop]).toEqual([this.existingValue]);
        });
        it('unless there is no value at the specified index', function() {
            expect(propertyManagerSvc.editId(this.entity, this.prop, 10, this.newValue['@id'])).toEqual(false);
            expect(this.entity[this.prop]).toEqual([this.existingValue]);
        });
        it('unless the new value already exists', function() {
            this.entity[this.prop].push(this.newValue);
            expect(propertyManagerSvc.editId(this.entity, this.prop, 0, this.newValue['@id'])).toEqual(false);
            expect(this.entity[this.prop]).toEqual([this.existingValue, this.newValue]);
        });
        it('successfully', function() {
            expect(propertyManagerSvc.editId(this.entity, this.prop, 0, this.newValue['@id'])).toEqual(true);
            expect(this.entity[this.prop]).toEqual([this.newValue]);
        });
    });
});
