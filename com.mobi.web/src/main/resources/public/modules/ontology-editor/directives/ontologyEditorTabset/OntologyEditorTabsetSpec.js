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
describe('Ontology Editor Tabset directive', function() {
    var $compile, scope, ontologyManagerSvc, ontologyStateSvc;

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

        this.listItemA = { ontologyId: 'A', ontologyRecord: { recordId: 'A', recordTitle: 'A', type: 'ontology'}, active: false, upToDate: false };
        this.listItemB = { ontologyId: 'B', ontologyRecord: { recordId: 'B', recordTitle: 'B', type: 'vocabulary'}, active: false, upToDate: true };
        ontologyStateSvc.list = [this.listItemA, this.listItemB];
        this.element = $compile(angular.element('<ontology-editor-tabset></ontology-editor-tabset>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('ontologyEditorTabset');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyManagerSvc = null;
        ontologyStateSvc = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('ontology-editor-tabset')).toBe(true);
        });
        it('with a tabset', function() {
            expect(this.element.find('tabset').length).toBe(1);
        });
        it('with a ontology-default-tab', function() {
            expect(this.element.querySelectorAll('tab ontology-default-tab').length).toBe(1);
        });
        it('depending on how many ontologies are open', function() {
            expect(this.element.find('tab').length).toBe(ontologyStateSvc.list.length + 1);
        });
        it('depending on whether a ontology is up to date', function() {
            var tabs = this.element.find('tab');
            expect(angular.element(tabs[0]).hasClass('up-to-date')).toBe(false);
            expect(angular.element(tabs[1]).hasClass('up-to-date')).toBe(true);
        });
        it('depending on whether a tab is for an ontology or a vocabulary', function() {
            var tabs = this.element.find('tab');
            expect(angular.element(tabs[0]).find('ontology-tab').length).toBe(1);
            expect(angular.element(tabs[0]).find('vocabulary-tab').length).toBe(0);
            expect(angular.element(tabs[1]).find('ontology-tab').length).toBe(0);
            expect(angular.element(tabs[1]).find('vocabulary-tab').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            ontologyStateSvc.listItem = this.listItemA;
        });
        describe('should close a tab', function() {
            beforeEach(function() {
                ontologyStateSvc.recordIdToClose = '';
                ontologyStateSvc.showCloseOverlay = false;
            });
            it('if it has changes', function() {
                this.controller.onClose('A');
                expect(ontologyStateSvc.recordIdToClose).toBe('A');
                expect(ontologyStateSvc.showCloseOverlay).toBe(true);
                expect(ontologyStateSvc.closeOntology).not.toHaveBeenCalled();
            });
            it('if it has no changes', function() {
                ontologyStateSvc.listItem = this.listItemB;
                ontologyStateSvc.hasChanges.and.returnValue(false);
                this.controller.onClose('B');
                expect(ontologyStateSvc.recordIdToClose).toBe('');
                expect(ontologyStateSvc.showCloseOverlay).toBe(false);
                expect(ontologyStateSvc.closeOntology).toHaveBeenCalledWith('B');
            });
        });
        describe('onClick should set the listItem and page title correctly if recordId is', function() {
            it('defined', function() {
                ontologyStateSvc.getListItemByRecordId.and.returnValue({ontologyRecord: {type: 'type'}});
                this.controller.onClick('recordId');
                expect(ontologyStateSvc.getListItemByRecordId).toHaveBeenCalledWith('recordId');
                expect(ontologyStateSvc.listItem).toEqual({ontologyRecord: {type: 'type'}});
                expect(ontologyStateSvc.setPageTitle).toHaveBeenCalledWith('type');
            });
            it('undefined', function() {
                this.controller.onClick(undefined);
                expect(ontologyStateSvc.getListItemByRecordId).not.toHaveBeenCalled();
                expect(ontologyStateSvc.setPageTitle).toHaveBeenCalled();
            });
        });
    });
});