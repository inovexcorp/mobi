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
describe('Ontology Select Overlay directive', function() {
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
        module('ontologySelectOverlay');
        injectTrustedFilter();
        injectHighlightFilter();
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
            ontologyManagerSvc.list = [{ontologyId: 'open'}];
            ontologyManagerSvc.ontologyIds = ['closed'];
            mappingManagerSvc.getOntology.and.returnValue($q.when({id: 'open'}))
            var element = $compile(angular.element('<ontology-select-overlay></ontology-select-overlay>'))(scope);
            scope.$digest();
            var controller = element.controller('ontologySelectOverlay');
            expect(controller.ontologyIds).toContain('open');
            expect(controller.ontologyIds).toContain('closed');
        });
        it('if a mapping has not been set', function() {
            mappingManagerSvc.mapping = {jsonld: []};
            mappingManagerSvc.sourceOntologies = [];
            var element = $compile(angular.element('<ontology-select-overlay></ontology-select-overlay>'))(scope);
            scope.$digest();
            var controller = element.controller('ontologySelectOverlay');
            expect(controller.ontologyObjs.length).toBe(0);
            expect(controller.selectedOntology).toEqual(undefined);
            expect(controller.selectedOntologyId).toBe('');
        });
        it('if a mapping has already been set', function() {
            mappingManagerSvc.mapping = {jsonld: []};
            var sourceOntology = {id: '', entities: []};
            mappingManagerSvc.sourceOntologies = [sourceOntology];
            mappingManagerSvc.getSourceOntology.and.returnValue(sourceOntology);
            var element = $compile(angular.element('<ontology-select-overlay></ontology-select-overlay>'))(scope);
            scope.$digest();
            var controller = element.controller('ontologySelectOverlay');
            expect(controller.ontologyObjs).toContain(sourceOntology);
            expect(controller.selectedOntology).toEqual(sourceOntology);
            expect(controller.selectedOntologyId).toBe(sourceOntology.id);
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            mappingManagerSvc.mapping = {jsonld: []};
            this.sourceOntology = {id: '', entities: []};
            mappingManagerSvc.sourceOntologies = [this.sourceOntology];
            mappingManagerSvc.getSourceOntology.and.returnValue(this.sourceOntology);
            this.element = $compile(angular.element('<ontology-select-overlay></ontology-select-overlay>'))(scope);
            scope.$digest();
            controller = this.element.controller('ontologySelectOverlay');
        });
        it('should test whether an ontology is open', function() {
            var result = controller.isOpen('test');
            expect(result).toBe(false);
            result = controller.isOpen('');
            expect(result).toBe(true);
        });
        describe('should get an ontology by id', function() {
            beforeEach(function() {
                this.ontology = {id: 'test', entities: []};
                mappingManagerSvc.getOntology.and.returnValue($q.when(this.ontology));
            });
            it('if it is open', function() {
                controller.getOntology('test');
                $timeout.flush();
                expect(mappingManagerSvc.getOntology).toHaveBeenCalledWith('test');
                expect(typeof controller.selectedOntology).toBe('object');
            });
            it('if it is not open', function() {
                controller.ontologyObjs = [{id: 'test'}];
                controller.getOntology('test');
                $timeout.flush();
                expect(mappingManagerSvc.getOntology).not.toHaveBeenCalled();
                expect(typeof controller.selectedOntology).toBe('object');
            });
        });
        it('should get the name of the passed ontology', function() {
            var result = controller.getName('test');
            expect(ontologyManagerSvc.getEntityName).not.toHaveBeenCalled();
            expect(ontologyManagerSvc.getBeautifulIRI).toHaveBeenCalledWith('test');
            expect(typeof result).toBe('string');

            ontologyManagerSvc.getBeautifulIRI.calls.reset();
            controller.ontologyObjs = [{id: 'test'}];
            result = controller.getName('test');
            expect(ontologyManagerSvc.getEntityName).toHaveBeenCalled();
            expect(ontologyManagerSvc.getBeautifulIRI).not.toHaveBeenCalled();
            expect(typeof result).toBe('string');
        });
        describe('should set the correct state for continuing', function() {
            beforeEach(function() {
                this.sourceOntologies = angular.copy(mappingManagerSvc.sourceOntologies);
                controller.selectedOntology = {id: 'test', entities: []};
            });
            it('if the ontology is not being changed', function() {
                mapperStateSvc.changeOntology = false;
                controller.selectedOntologyId = 'test';
                controller.continue();
                expect(mapperStateSvc.cacheSourceOntologies).not.toHaveBeenCalled();
                expect(mapperStateSvc.getCachedSourceOntologyId).toHaveBeenCalled();
                expect(mappingManagerSvc.setSourceOntology).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld, controller.selectedOntologyId);
                expect(ontologyManagerSvc.getImportedOntologies).toHaveBeenCalledWith(controller.selectedOntologyId);
                expect(mappingManagerSvc.sourceOntologies).not.toEqual(this.sourceOntologies);
                expect(mapperStateSvc.step).toBe(mapperStateSvc.startingClassSelectStep);
            });
            describe('if the ontology is being changed', function() {
                beforeEach(function() {
                    mapperStateSvc.changeOntology = true;
                });
                it('and a different ontology is selected', function() {
                    controller.selectedOntologyId = 'test';
                    controller.continue();
                    expect(mapperStateSvc.cacheSourceOntologies).toHaveBeenCalled();
                    expect(mapperStateSvc.getCachedSourceOntologyId).toHaveBeenCalled();
                    expect(mappingManagerSvc.setSourceOntology).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld, controller.selectedOntologyId);
                    expect(ontologyManagerSvc.getImportedOntologies).toHaveBeenCalledWith(controller.selectedOntologyId);
                    expect(mappingManagerSvc.sourceOntologies).not.toEqual(this.sourceOntologies);
                    expect(mapperStateSvc.step).toBe(mapperStateSvc.startingClassSelectStep);
                });
                it('and the same ontology is chosen', function() {
                    controller.selectedOntologyId = '';
                    controller.continue();
                    expect(mapperStateSvc.cacheSourceOntologies).toHaveBeenCalled();
                    expect(mapperStateSvc.getCachedSourceOntologyId).toHaveBeenCalled();
                    expect(mappingManagerSvc.setSourceOntology).not.toHaveBeenCalled();
                    expect(ontologyManagerSvc.getImportedOntologies).not.toHaveBeenCalled();
                    expect(mappingManagerSvc.sourceOntologies).toEqual(this.sourceOntologies);
                    expect(mapperStateSvc.step).toBe(mapperStateSvc.startingClassSelectStep);
                });
            });
        });
        describe('should set the correct state for going back', function() {
            beforeEach(function() {
                this.sourceOntologies = angular.copy(mappingManagerSvc.sourceOntologies);
            });
            it('if the ontology is being changed', function() {
                mapperStateSvc.changeOntology = true;
                controller.back();
                expect(mapperStateSvc.restoreCachedSourceOntologies).toHaveBeenCalled();
                expect(mapperStateSvc.step).toBe(mapperStateSvc.editMappingStep);
                expect(mapperStateSvc.changeOntology).toBe(false);
                expect(mappingManagerSvc.sourceOntologies).toEqual(this.sourceOntologies);
                expect(mappingManagerSvc.setSourceOntology).not.toHaveBeenCalled();
            });
            it('if the ontology is not being changed', function() {
                mapperStateSvc.changeOntology = false;
                controller.back();
                expect(mapperStateSvc.restoreCachedSourceOntologies).not.toHaveBeenCalled();
                expect(mapperStateSvc.step).toBe(mapperStateSvc.fileUploadStep);
                expect(mappingManagerSvc.sourceOntologies).toEqual([]);
                expect(mappingManagerSvc.setSourceOntology).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld, '');
            });
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            mappingManagerSvc.mapping = {jsonld: []};
            this.element = $compile(angular.element('<ontology-select-overlay ontology="ontology" on-click-back="onClickBack()" on-click-continue="onClickContinue(ontologyId)"></ontology-select-overlay>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('ontology-select-overlay')).toBe(true);
            expect(this.element.querySelectorAll('form.content').length).toBe(1);
            expect(this.element.querySelectorAll('div.ontology-select').length).toBe(1);
        });
        it('with a ui-select', function() {
            expect(this.element.find('ui-select').length).toBe(1);
        });
        it('with an ontology preview', function() {
            expect(this.element.find('ontology-preview').length).toBe(1);
        });
        it('with custom buttons to go back and continue', function() {
            var buttons = this.element.find('custom-button');
            expect(buttons.length).toBe(2);
            expect(['Back', 'Continue'].indexOf(angular.element(buttons[0]).text()) >= 0).toBe(true);
            expect(['Back', 'Continue'].indexOf(angular.element(buttons[1]).text()) >= 0).toBe(true);
        });
    });
});