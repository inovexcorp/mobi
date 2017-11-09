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
describe('Relationship Overlay directive', function() {
    var $compile, scope, ontologyStateSvc, ontologyManagerSvc, resObj, splitIRIFilter, ontoUtils;

    beforeEach(function() {
        module('templates');
        module('relationshipOverlay');
        injectHighlightFilter();
        injectTrustedFilter();
        injectSplitIRIFilter();
        mockResponseObj();
        mockOntologyManager();
        mockOntologyState();
        mockUtil();
        mockOntologyUtilsManager();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _responseObj_, _ontologyManagerService_, _splitIRIFilter_, _ontologyUtilsManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            resObj = _responseObj_;
            ontologyManagerSvc = _ontologyManagerService_;
            splitIRIFilter = _splitIRIFilter_;
            ontoUtils = _ontologyUtilsManagerService_;
        });

        scope.relationshipList = [];
        this.element = $compile(angular.element('<relationship-overlay relationship-list="relationshipList"></relationship-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('relationshipOverlay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        ontologyManagerSvc = null;
        resObj = null;
        splitIRIFilter = null;
        ontoUtils = null;
        this.element.remove();
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            this.isolatedScope = this.element.isolateScope();
        });
        it('relationshipList should be one way bound', function() {
            this.isolatedScope.relationshipList = [{}];
            scope.$digest();
            expect(scope.relationshipList).toEqual([]);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('relationship-overlay')).toBe(true);
            expect(this.element.find('form').length).toBe(1);
            expect(this.element.querySelectorAll('.content').length).toBe(1);
        });
        it('with a h6', function() {
            expect(this.element.find('h6').length).toBe(1);
        });
        it('with .form-groups', function() {
            expect(this.element.querySelectorAll('.form-group').length).toBe(2);
        });
        it('with custom-labels', function() {
            expect(this.element.find('custom-label').length).toBe(2);
        });
        it('with ui-selects', function() {
            expect(this.element.find('ui-select').length).toBe(2);
        });
        it('with a .btn-container', function() {
            expect(this.element.querySelectorAll('.btn-container').length).toBe(1);
        });
        it('with buttons to add and cancel', function() {
            var buttons = this.element.querySelectorAll('.btn-container button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Add']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Add']).toContain(angular.element(buttons[1]).text().trim());
        });
        it('depending on whether a relationship is selected', function() {
            this.controller.values = [{}];
            scope.$digest();
            var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            this.controller.relationship = {};
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
        it('depending on whether values are selected', function() {
            this.controller.relationship = {};
            scope.$digest();
            var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            this.controller.values = [{}];
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
    });
    describe('controller methods', function() {
        it('should add a relationship', function() {
            this.controller.relationship = {};
            this.controller.values = [{}];
            resObj.getItemIri.and.returnValue('axiom');
            this.controller.addRelationship();
            expect(resObj.getItemIri).toHaveBeenCalledWith(this.controller.relationship);
            expect(ontologyStateSvc.listItem.selected.axiom).toEqual(this.controller.values);
            expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
            expect(ontologyStateSvc.showRelationshipOverlay).toBe(false);
            expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
        });
        describe('getValues should return the correct values when controller.relationship', function() {
            beforeEach(function() {
                this.controller.array = ['initial'];
            });
            it('has values', function() {
                ontoUtils.getSelectList.and.returnValue(['item']);
                this.controller.conceptList = ['first', 'second'];
                this.controller.relationship = { values: 'conceptList' };
                this.controller.getValues('I');
                expect(ontoUtils.getSelectList).toHaveBeenCalledWith(['first', 'second'], 'I');
                expect(this.controller.array).toEqual(['item']);
            });
            it('does not have values', function() {
                this.controller.relationship = {};
                this.controller.getValues('stuff');
                expect(this.controller.array).toEqual([]);
            });
        });
    });
    it('should call addRelationship when the button is clicked', function() {
        this.controller = this.element.controller('relationshipOverlay');
        spyOn(this.controller, 'addRelationship');

        var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(this.controller.addRelationship).toHaveBeenCalled();
    });
    it('should set the correct state when the Cancel button is clicked', function() {
        var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-default')[0]);
        button.triggerHandler('click');
        expect(ontologyStateSvc.showRelationshipOverlay).toBe(false);
    });
});