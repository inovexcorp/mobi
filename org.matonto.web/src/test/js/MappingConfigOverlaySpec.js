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
describe('Mapping Config Overlay directive', function() {
    var $compile,
        scope,
        ontologyManagerSvc,
        mappingManagerSvc,
        mapperStateSvc,
        $q,
        $timeout,
        controller;

    beforeEach(function() {
        module('templates');
        module('mappingConfigOverlay');
        injectHighlightFilter();
        injectTrustedFilter();
        mockOntologyManager();
        mockMappingManager();
        mockMapperState();

        inject(function(_$compile_, _$rootScope_, _ontologyManagerService_, _mappingManagerService_, _mapperStateService_, _$q_, _$timeout_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyManagerSvc = _ontologyManagerService_;
            mapperStateSvc = _mapperStateService_;
            mappingManagerSvc = _mappingManagerService_;
            $q = _$q_;
            $timeout = _$timeout_;
        });
    });

    describe('should initialize with the correct values', function() {
        it('using opened and closed ontologies', function() {
            mappingManagerSvc.mapping = {jsonld: []};
            ontologyManagerSvc.list = [{ontologyId: 'open'}];
            ontologyManagerSvc.ontologyIds = ['closed'];
            var element = $compile(angular.element('<mapping-config-overlay></mapping-config-overlay>'))(scope);
            scope.$digest();
            controller = element.controller('mappingConfigOverlay');
            expect(controller.ontologyIds).toContain('open');
            expect(controller.ontologyIds).toContain('closed');
        });
        it('if there are no source ontologies', function() {
            mappingManagerSvc.mapping = {jsonld: []};
            mappingManagerSvc.sourceOntologies = [];
            var element = $compile(angular.element('<mapping-config-overlay></mapping-config-overlay>'))(scope);
            scope.$digest();
            controller = element.controller('mappingConfigOverlay');
            expect(controller.ontologies).toEqual({});
            expect(controller.selectedOntologyId).toBe('');
            expect(controller.classes).toEqual([]);
            expect(controller.selectedBaseClass).toBeUndefined();
        });
        it('if there are source ontologies', function() {
            mappingManagerSvc.mapping = {jsonld: []};
            var sourceOntology = {id: 'test', entities: []};
            var classObj = {'@id': 'class'};
            var classes = [classObj];
            ontologyManagerSvc.getClasses.and.returnValue(classes);
            mappingManagerSvc.sourceOntologies = [sourceOntology];
            mappingManagerSvc.getSourceOntology.and.returnValue(sourceOntology);
            mappingManagerSvc.getClassIdByMapping.and.returnValue(classObj['@id']);
            var element = $compile(angular.element('<mapping-config-overlay></mapping-config-overlay>'))(scope);
            scope.$digest();
            controller = element.controller('mappingConfigOverlay');
            expect(controller.ontologies).toEqual({test: mappingManagerSvc.sourceOntologies});
            expect(controller.selectedOntologyId).toBe(sourceOntology.id);
            expect(controller.classes).toEqual(classes);
            expect(controller.selectedBaseClass).toEqual(classObj);
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            mappingManagerSvc.mapping = {name: '', jsonld: []};
            this.element = $compile(angular.element('<mapping-config-overlay></mapping-config-overlay>'))(scope);
            scope.$digest();
            controller = this.element.controller('mappingConfigOverlay');
        });
        describe('should correctly select an ontology', function() {
            beforeEach(function() {
                this.classes = [{'@id': 'class'}];
                this.id = 'ontology';
                ontologyManagerSvc.getClasses.and.returnValue(this.classes);
                spyOn(controller, 'getOntologyClosure').and.returnValue([{}]);
            });
            it('if it had been opened', function() {
                controller.ontologies[this.id] = [];
                controller.selectOntology(this.id);
                expect(controller.selectedOntologyId).toBe(this.id);
                expect(controller.classes).toEqual(this.classes);
                expect(controller.selectedBaseClass).toBeUndefined();
            });
            describe('if it had not been opened', function() {
                beforeEach(function() {
                    this.ontology = {};
                    mappingManagerSvc.getOntology.and.returnValue($q.when(this.ontology));
                });
                it('unless an error occurs', function() {
                    ontologyManagerSvc.getImportedOntologies.and.returnValue($q.reject('Error message'));
                    controller.selectOntology(this.id);
                    $timeout.flush();
                    expect(controller.selectedOntologyId).toBe(this.id);
                    expect(controller.ontologies[this.id]).toEqual([this.ontology]);
                    expect(ontologyManagerSvc.getImportedOntologies).toHaveBeenCalledWith(this.id);
                    expect(controller.errorMessage).toBe('Error message');

                    controller.selectedOntologyId = '';
                    controller.ontologies = {};
                    ontologyManagerSvc.getImportedOntologies.calls.reset();
                    mappingManagerSvc.getOntology.and.returnValue($q.reject('Error message'));
                    controller.selectOntology(this.id);
                    $timeout.flush();
                    expect(controller.selectedOntologyId).not.toBe(this.id);
                    expect(_.has(controller.ontologies, this.id)).toBe(false);
                    expect(ontologyManagerSvc.getImportedOntologies).not.toHaveBeenCalled();
                    expect(controller.errorMessage).toBe('Error message');
                });
                it('successfully', function() {
                    var importedOntology = {id: '', ontology: []};
                    ontologyManagerSvc.getImportedOntologies.and.returnValue($q.when([importedOntology]));
                    controller.selectOntology(this.id);
                    $timeout.flush();
                    expect(controller.selectedOntologyId).toBe(this.id);
                    expect(controller.ontologies[this.id]).toContain(this.ontology);
                    expect(ontologyManagerSvc.getImportedOntologies).toHaveBeenCalledWith(this.id);
                    expect(controller.classes).toEqual(_.concat(this.classes, this.classes));
                    expect(controller.selectedBaseClass).toBeUndefined();
                });
            });
        });
        it('should get an opened ontology', function() {
            var ontology = {'id': 'ontology'}
            spyOn(controller, 'getOntologyClosure').and.returnValue([ontology]);
            var result = controller.getOntology(ontology.id);
            expect(result).toEqual(ontology);
        });
        it('should get the imports closure of an opened ontology', function() {
            var id = 'test';
            var ontologies = [];
            _.set(controller.ontologies, id, ontologies);
            var result = controller.getOntologyClosure(id);
            expect(result).toEqual(ontologies);
        });
        describe('should get the name of an ontology', function() {
            beforeEach(function() {
                this.id = 'test';
            })
            it('if it has been opened', function() {
                _.set(controller.ontologies, this.id, []);
                spyOn(controller, 'getOntology').and.returnValue({entities: []});
                var result = controller.getName(this.id);
                expect(controller.getOntology).toHaveBeenCalledWith(this.id);
                expect(ontologyManagerSvc.getOntologyEntity).toHaveBeenCalled();
                expect(ontologyManagerSvc.getEntityName).toHaveBeenCalled();
                expect(typeof result).toBe('string');
            });
            it('if it has not been opened', function() {
                var result = controller.getName(this.id);
                expect(ontologyManagerSvc.getBeautifulIRI).toHaveBeenCalledWith(this.id);
                expect(typeof result).toBe('string');
            });
        });
        describe('should set the correct state for setting the configuration', function() {
            beforeEach(function() {
                this.ontologies = [];
                this.classMapping = {'@id': 'classMap'};
                this.originalMapping = angular.copy(mappingManagerSvc.mapping.jsonld);
                spyOn(controller, 'getOntologyClosure').and.returnValue(this.ontologies);
                mappingManagerSvc.getAllClassMappings.and.returnValue([this.classMapping]);
                mappingManagerSvc.addClass.and.returnValue([{}]);
                controller.selectedBaseClass = {'@id': 'base'};
            });
            it('if a configuration had already been set', function() {
                mappingManagerSvc.getSourceOntologyId.and.returnValue('test');
                controller.set();
                expect(mappingManagerSvc.createNewMapping).toHaveBeenCalledWith(mappingManagerSvc.mapping.name);
                expect(mappingManagerSvc.sourceOntologies).toEqual(this.ontologies);
                expect(mappingManagerSvc.setSourceOntology).toHaveBeenCalled();
                expect(mappingManagerSvc.findSourceOntologyWithClass).toHaveBeenCalled();
                expect(mappingManagerSvc.addClass).toHaveBeenCalled();
                expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                expect(mapperStateSvc.selectedClassMappingId).toBe(this.classMapping['@id']);
                expect(mapperStateSvc.setAvailableProps).toHaveBeenCalledWith(this.classMapping['@id']);
                expect(mappingManagerSvc.mapping.jsond).not.toBe(this.originalMapping);
                expect(mapperStateSvc.displayMappingConfig).toBe(false);
            });
            it('if a configuration had not been set before', function() {
                mappingManagerSvc.getSourceOntologyId.and.returnValue('');
                controller.set();
                expect(mappingManagerSvc.createNewMapping).not.toHaveBeenCalled();
                expect(mappingManagerSvc.sourceOntologies).toEqual(this.ontologies);
                expect(mappingManagerSvc.setSourceOntology).toHaveBeenCalled();
                expect(mappingManagerSvc.findSourceOntologyWithClass).toHaveBeenCalled();
                expect(mappingManagerSvc.addClass).toHaveBeenCalled();
                expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                expect(mapperStateSvc.selectedClassMappingId).toBe(this.classMapping['@id']);
                expect(mapperStateSvc.setAvailableProps).toHaveBeenCalledWith(this.classMapping['@id']);
                expect(mappingManagerSvc.mapping.jsond).not.toBe(this.originalMapping);
            });
        });
        it('should set the correct state for canceling', function() {
            controller.cancel();
            expect(mapperStateSvc.displayMappingConfig).toBe(false);
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            mappingManagerSvc.mapping = {name: '', jsonld: []};
            this.element = $compile(angular.element('<mapping-config-overlay></mapping-config-overlay>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('mapping-config-overlay')).toBe(true);
            expect(this.element.querySelectorAll('form.content').length).toBe(1);
            expect(this.element.querySelectorAll('.ontology-select-container').length).toBe(1);
            expect(this.element.querySelectorAll('.ontology-select').length).toBe(1);
            expect(this.element.querySelectorAll('.base-class-select-container').length).toBe(1);
            expect(this.element.querySelectorAll('.base-class-select').length).toBe(1);
        });
        it('with ui selects', function() {
            expect(this.element.find('ui-select').length).toBe(2);
        });
        it('with an ontology preview', function() {
            expect(this.element.find('ontology-preview').length).toBe(1);
        });
        it('with a class preview', function() {
            expect(this.element.find('class-preview').length).toBe(1);
        });
        it('depending on whether an error has occured', function() {
            controller = this.element.controller('mappingConfigOverlay');
            expect(this.element.find('error-display').length).toBe(0);

            controller.errorMessage = 'test';
            scope.$digest();
            expect(this.element.find('error-display').length).toBe(1);
        });
        it('depending on whether an ontology and a base class have been selected', function() {
            controller = this.element.controller('mappingConfigOverlay');
            var setButton = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
            expect(setButton.attr('disabled')).toBeTruthy();

            controller.selectedOntologyId = 'ontology';
            scope.$digest();
            expect(setButton.attr('disabled')).toBeTruthy();

            controller.selectedBaseClass = {};
            scope.$digest();
            expect(setButton.attr('disabled')).toBeFalsy();
        });
        it('with buttons to cancel and set', function() {
            var buttons = this.element.querySelectorAll('.btn-container button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Set']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Set']).toContain(angular.element(buttons[1]).text().trim());
        });
    });
    it('should call set when the button is clicked', function() {
        var element = $compile(angular.element('<mapping-config-overlay></mapping-config-overlay>'))(scope);
        scope.$digest();
        controller = element.controller('mappingConfigOverlay');
        spyOn(controller, 'set');

        var continueButton = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
        continueButton.triggerHandler('click');
        expect(controller.set).toHaveBeenCalled();
    });
    it('should call cancel when the button is clicked', function() {
        var element = $compile(angular.element('<mapping-config-overlay></mapping-config-overlay>'))(scope);
        scope.$digest();
        controller = element.controller('mappingConfigOverlay');
        spyOn(controller, 'cancel');

        var continueButton = angular.element(element.querySelectorAll('.btn-container button.btn-default')[0]);
        continueButton.triggerHandler('click');
        expect(controller.cancel).toHaveBeenCalled();
    });
});