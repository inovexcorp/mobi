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
    var $compile, scope, $q, ontologyStateSvc, ontologyManagerSvc, util, ontoUtils, propertyManagerSvc;

    beforeEach(function() {
        module('templates');
        module('relationshipOverlay');
        injectHighlightFilter();
        injectTrustedFilter();
        mockOntologyManager();
        mockOntologyState();
        mockUtil();
        mockOntologyUtilsManager();
        mockPropertyManager();

        inject(function(_$compile_, _$rootScope_, _$q_, _ontologyStateService_, _ontologyManagerService_, _utilService_, _ontologyUtilsManagerService_, _propertyManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyManagerSvc = _ontologyManagerService_;
            util = _utilService_;
            ontoUtils = _ontologyUtilsManagerService_;
            propertyManagerSvc = _propertyManagerService_;
        });

        scope.relationshipList = [];
        scope.onSubmit = jasmine.createSpy('onSubmit');
        this.element = $compile(angular.element('<relationship-overlay relationship-list="relationshipList" on-submit="onSubmit(relationship, values)"></relationship-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('relationshipOverlay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        ontologyStateSvc = null;
        ontologyManagerSvc = null;
        util = null;
        ontoUtils = null;
        propertyManagerSvc = null;
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
    describe('controller bound variable', function() {
        it('onSubmit should be called in parent scope', function() {
            this.controller.onSubmit({relationship: '', values: []});
            expect(scope.onSubmit).toHaveBeenCalledWith('', []);
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

            this.controller.relationship = 'relationship';
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
        it('depending on whether values are selected', function() {
            this.controller.relationship = 'relationship';
            scope.$digest();
            var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            this.controller.values = [{}];
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
    });
    describe('controller methods', function() {
        describe('should add a relationship', function() {
            beforeEach(function() {
                this.controller.relationship = 'relationship';
                this.controller.values = ['iri'];
                propertyManagerSvc.addId.and.returnValue(true);
                this.expected = {'@id': ontologyStateSvc.listItem.selected['@id']};
                this.expected[this.controller.relationship] = [{'@id': 'iri'}];
                ontoUtils.saveCurrentChanges.and.returnValue($q.when());
            });
            it('unless there is a duplicate value', function() {
                propertyManagerSvc.addId.and.returnValue(false);
                this.controller.addRelationship();
                scope.$apply();
                expect(propertyManagerSvc.addId).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, this.controller.relationship, 'iri');
                expect(ontologyStateSvc.addToAdditions).not.toHaveBeenCalled();
                expect(ontoUtils.saveCurrentChanges).not.toHaveBeenCalled();
                expect(scope.onSubmit).not.toHaveBeenCalled();
                expect(util.createWarningToast).toHaveBeenCalled();
                expect(ontologyStateSvc.showRelationshipOverlay).toBe(false);
            });
            it('if there is at least one new value', function() {
                this.controller.addRelationship();
                scope.$apply();
                expect(propertyManagerSvc.addId).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, this.controller.relationship, 'iri');
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.expected);
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                expect(scope.onSubmit).toHaveBeenCalledWith(this.controller.relationship, this.expected[this.controller.relationship]);
                expect(util.createWarningToast).not.toHaveBeenCalled();
                expect(ontologyStateSvc.showRelationshipOverlay).toBe(false);
            });
        });
        describe('getValues should return the correct values when controller.relationship', function() {
            beforeEach(function() {
                this.controller.array = ['initial'];
                this.controller.relationship = 'relationship';
            });
            it('is a scheme relationship', function() {
                ontoUtils.getSelectList.and.returnValue(['item']);
                this.controller.schemeList = ['first', 'second'];
                propertyManagerSvc.conceptSchemeRelationshipList = ['relationship'];
                this.controller.getValues('I');
                expect(ontoUtils.getSelectList).toHaveBeenCalledWith(['first', 'second'], 'I');
                expect(this.controller.array).toEqual(['item']);
            });
            it('is a semantic relation', function() {
                ontoUtils.getSelectList.and.returnValue(['item']);
                this.controller.conceptList = ['first', 'second'];
                ontologyStateSvc.listItem.derivedSemanticRelations = ['relationship'];
                this.controller.getValues('I');
                expect(ontoUtils.getSelectList).toHaveBeenCalledWith(['first', 'second'], 'I');
                expect(this.controller.array).toEqual(['item']);
            });
            it('is not a scheme relationship or a semantic relation', function() {
                this.controller.getValues('I');
                expect(ontoUtils.getSelectList).not.toHaveBeenCalledWith();
                expect(this.controller.array).toEqual([]);
            });
        });
    });
    it('should call addRelationship when the button is clicked', function() {
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