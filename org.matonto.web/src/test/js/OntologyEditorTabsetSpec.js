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
describe('Ontology Editor Tabset directive', function() {
    var $compile,
        scope,
        element,
        ontologyManagerSvc,
        ontologyStateSvc;

    beforeEach(function() {
        module('templates');
        module('ontologyEditorTabset');
        mockOntologyManager();
        mockOntologyState();

        inject(function(_$compile_, _$rootScope_, _ontologyManagerService_, _ontologyStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyManagerSvc = _ontologyManagerService_;
            ontologyStateSvc = _ontologyStateService_;
        });

        ontologyManagerSvc.list = [{recordId: 'A', upToDate: false}, {recordId: 'B', upToDate: true}];
        var types = {'A': 'ontology', 'B': 'vocabulary'};
        ontologyStateSvc.getState.and.callFake(function(id) {
            return {type: _.get(types, id)};
        });
        element = $compile(angular.element('<ontology-editor-tabset></ontology-editor-tabset>'))(scope);
        scope.$digest();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.hasClass('ontology-editor-tabset')).toBe(true);
        });
        it('with a tabset', function() {
            expect(element.find('tabset').length).toBe(1);
        });
        it('with a ontology-default-tab', function() {
            expect(element.querySelectorAll('tab ontology-default-tab').length).toBe(1);
        });
        it('depending on how many ontologies are open', function() {
            expect(element.find('tab').length).toBe(ontologyManagerSvc.list.length + 1);
        });
        it('depending on whether a ontology is up to date', function() {
            var tabs = element.find('tab');
            expect(angular.element(tabs[0]).hasClass('up-to-date')).toBe(false);
            expect(angular.element(tabs[1]).hasClass('up-to-date')).toBe(true);
        });
        it('depending on whether a tab is for an ontology or a vocabulary', function() {
            var tabs = element.find('tab');
            expect(angular.element(tabs[0]).find('ontology-tab').length).toBe(1);
            expect(angular.element(tabs[0]).find('vocabulary-tab').length).toBe(0);
            expect(angular.element(tabs[1]).find('ontology-tab').length).toBe(0);
            expect(angular.element(tabs[1]).find('vocabulary-tab').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            controller = element.controller('ontologyEditorTabset');
        });
        describe('should close a tab', function() {
            beforeEach(function() {
                ontologyStateSvc.recordIdToClose = '';
                ontologyStateSvc.showCloseOverlay = false;
            });
            it('if it has changes', function() {
                controller.onClose('record');
                expect(ontologyStateSvc.recordIdToClose).toBe('record');
                expect(ontologyStateSvc.showCloseOverlay).toBe(true);
                expect(ontologyStateSvc.deleteState).not.toHaveBeenCalled();
                expect(ontologyManagerSvc.closeOntology).not.toHaveBeenCalled();
            });
            it('if it has no changes', function() {
                ontologyStateSvc.hasChanges.and.returnValue(false);
                controller.onClose('record');
                expect(ontologyStateSvc.recordIdToClose).toBe('');
                expect(ontologyStateSvc.showCloseOverlay).toBe(false);
                expect(ontologyStateSvc.deleteState).toHaveBeenCalledWith('record');
                expect(ontologyManagerSvc.closeOntology).toHaveBeenCalledWith('record');
            });
        });
    });
});