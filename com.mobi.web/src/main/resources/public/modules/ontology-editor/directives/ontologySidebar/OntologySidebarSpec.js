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
describe('Ontology Sidebar directive', function() {
    var $compile, scope, ontologyManagerSvc, ontologyStateSvc;

    beforeEach(function() {
        module('templates');
        module('ontologySidebar');
        mockOntologyManager();
        mockOntologyState();

        inject(function(_$compile_, _$rootScope_, _ontologyManagerService_, _ontologyStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyManagerSvc = _ontologyManagerService_;
            ontologyStateSvc = _ontologyStateService_;
        });

        this.listItemA = { ontologyId: 'A', ontologyRecord: { recordId: 'A', recordTitle: 'A'}, active: false};
        this.listItemB = { ontologyId: 'B', ontologyRecord: { recordId: 'B', recordTitle: 'B'}, active: false };
        ontologyStateSvc.list = [this.listItemA, this.listItemB];
        this.element = $compile(angular.element('<ontology-sidebar></ontology-sidebar>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('ontologySidebar');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyManagerSvc = null;
        ontologyStateSvc = null;
        this.element.remove();
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
                this.controller.onClose({ ontologyRecord: { recordId: 'A' } });
                expect(ontologyStateSvc.recordIdToClose).toBe('A');
                expect(ontologyStateSvc.showCloseOverlay).toBe(true);
                expect(ontologyStateSvc.closeOntology).not.toHaveBeenCalled();
            });
            it('if it has no changes', function() {
                ontologyStateSvc.listItem = this.listItemB;
                ontologyStateSvc.hasChanges.and.returnValue(false);
                this.controller.onClose({ ontologyRecord: { recordId: 'B' } });
                expect(ontologyStateSvc.recordIdToClose).toBe('');
                expect(ontologyStateSvc.showCloseOverlay).toBe(false);
                expect(ontologyStateSvc.closeOntology).toHaveBeenCalledWith('B');
            });
        });
        describe('onClick should set the listItem and active state correctly if listItem is', function() {
            beforeEach(function () {
                this.oldListItem = {id: 'id'};
                ontologyStateSvc.listItem = this.oldListItem;
            });
            it('defined', function() {
                this.controller.onClick({ontologyRecord: {type: 'type'}});
                expect(ontologyStateSvc.listItem).toEqual({ontologyRecord: {type: 'type'}, active: true});
                expect(this.oldListItem.active).toEqual(false);
            });
            it('undefined', function() {
                this.controller.onClick(undefined);
                expect(ontologyStateSvc.listItem).toEqual({});
                expect(this.oldListItem.active).toEqual(false);
            });
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('ontology-sidebar')).toBe(true);
            expect(this.element.querySelectorAll('.button-container').length).toEqual(1);
        });
        it('with a .nav', function() {
            expect(this.element.querySelectorAll('ul.nav').length).toBe(1);
        });
        it('depending on how many ontologies are open', function() {
            var tabs = this.element.querySelectorAll('li.nav-item');
            expect(tabs.length).toEqual(ontologyStateSvc.list.length);
        });
        it('depending on whether an ontology is open', function() {
            this.listItemA.active = true;
            scope.$digest();
            var tab = angular.element(this.element.querySelectorAll('li.nav-item')[0]);
            expect(tab.hasClass('active')).toEqual(true);
            expect(tab.find('ontology-branch-select').length).toEqual(1);
        });
    });
    it('should call onClick when the Ontologies button is clicked', function() {
        spyOn(this.controller, 'onClick');
        var button = angular.element(this.element.querySelectorAll('.button-container button')[0]);
        button.triggerHandler('click');
        expect(this.controller.onClick).toHaveBeenCalled();
    });
    it('should call onClick when an ontology nav item is clicked', function() {
        spyOn(this.controller, 'onClick');
        var link = angular.element(this.element.querySelectorAll('a.nav-link')[0]);
        link.triggerHandler('click');
        expect(this.controller.onClick).toHaveBeenCalledWith(this.listItemA);
    });
    it('should call onClose when a close icon on an ontology nav item is clicked', function() {
        spyOn(this.controller, 'onClose');
        var closeIcon = angular.element(this.element.querySelectorAll('.nav-item span.close-icon')[0]);
        closeIcon.triggerHandler('click');
        expect(this.controller.onClose).toHaveBeenCalledWith(this.listItemA);
    });
});