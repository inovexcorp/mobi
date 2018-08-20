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
describe('Remove Property Overlay directive', function() {
    var $compile, scope, $q, ontologyStateSvc, propertyManagerSvc, ontoUtils, prefixes, ontologyManagerSvc;

    beforeEach(function() {
        module('templates');
        module('removePropertyOverlay');
        mockOntologyState();
        mockPropertyManager();
        mockOntologyUtilsManager();
        mockPrefixes();
        mockOntologyManager();

        inject(function(_$compile_, _$rootScope_, _$q_, _ontologyStateService_, _propertyManagerService_, _ontologyUtilsManagerService_, _prefixes_, _ontologyManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            ontologyStateSvc = _ontologyStateService_;
            propertyManagerSvc = _propertyManagerService_;
            ontoUtils = _ontologyUtilsManagerService_;
            prefixes = _prefixes_;
            ontologyManagerSvc = _ontologyManagerService_;
        });

        scope.index = 0;
        scope.key = 'key';
        scope.onSubmit = jasmine.createSpy('onSubmit');
        scope.overlayFlag = true;
        _.set(ontologyStateSvc.listItem.selected, scope.key + '[' + scope.index + ']', {'@id': 'id'});
        this.element = $compile(angular.element('<remove-property-overlay index="index" key="key" on-submit="onSubmit(axiomObject)" overlay-flag="overlayFlag"></remove-property-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('removePropertyOverlay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        ontologyStateSvc = null;
        propertyManagerSvc = null;
        ontoUtils = null;
        prefixes = null;
        ontologyManagerSvc = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('index should be one way bound', function() {
            this.controller.index = 1;
            scope.$digest();
            expect(scope.index).toEqual(0);
        });
        it('key should be one way bound', function() {
            this.controller.key = 'newKey';
            scope.$digest();
            expect(scope.key).toEqual('key');
        });
        it('overlayFlag should be two way bound', function() {
            this.controller.overlayFlag = false;
            scope.$digest();
            expect(scope.overlayFlag).toEqual(false);
        });
        it('onSubmit should be triggered on the scope', function() {
            this.controller.onSubmit();
            scope.$digest();
            expect(scope.onSubmit).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('remove-property-overlay')).toBe(true);
            expect(this.element.hasClass('overlay')).toBe(true);
            expect(this.element.find('form').length).toBe(1);
        });
        it('with a h6', function() {
            expect(this.element.find('h6').length).toBe(1);
        });
        ['main', 'btn-container', 'btn-primary'].forEach(function(item) {
            it('with a .' + item, function() {
                expect(this.element.querySelectorAll('.' + item).length).toBe(1);
            });
        }, this);
        it('with a regular .btn', function() {
            expect(this.element.querySelectorAll('.btn:not(.btn-primary)').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        describe('getValueDisplay should return', function() {
            it('the property @value', function() {
                ontologyStateSvc.listItem.selected[scope.key][scope.index] = {'@value': 'value'};
                expect(this.controller.getValueDisplay()).toEqual('value');
            });
            it('the property blank node value', function() {
                ontologyStateSvc.listItem.selected[scope.key][scope.index] = {'@id': 'id'};
                ontoUtils.getBlankNodeValue.and.returnValue('bnode');
                expect(this.controller.getValueDisplay()).toEqual('bnode');
                expect(ontoUtils.getBlankNodeValue).toHaveBeenCalledWith('id');
            });
            it('the property @id', function() {
                ontologyStateSvc.listItem.selected[scope.key][scope.index] = {'@id': 'id'};
                expect(this.controller.getValueDisplay()).toEqual('id');
                expect(ontoUtils.getBlankNodeValue).toHaveBeenCalledWith('id');
            });
        });
        describe('removeProperty calls the correct methods', function() {
            beforeEach(function() {
                ontologyStateSvc.listItem.flatEverythingTree = [];
                ontoUtils.saveCurrentChanges.and.returnValue($q.when());
            });
            it('if the selected key is rdfs:range', function() {
                this.controller.key = prefixes.rdfs + 'range';
                _.set(ontologyStateSvc.listItem.selected, this.controller.key + '[0]', {'@id': 'id'});
                ontologyStateSvc.createFlatEverythingTree.and.returnValue([{prop: 'everything'}]);
                ontologyStateSvc.getOntologiesArray.and.returnValue([]);
                this.controller.removeProperty();
                scope.$apply();
                expect(scope.onSubmit).toHaveBeenCalledWith({'@id': 'id'});
                expect(ontologyStateSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                expect(propertyManagerSvc.remove).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, this.controller.key, this.controller.index);
                expect(this.controller.overlayFlag).toBe(false);
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                expect(ontoUtils.updateLabel).toHaveBeenCalled();
                expect(ontologyStateSvc.updatePropertyIcon).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                expect(ontologyStateSvc.getOntologiesArray).not.toHaveBeenCalled();
                expect(ontologyStateSvc.createFlatEverythingTree).not.toHaveBeenCalled();
                expect(ontologyStateSvc.listItem.flatEverythingTree).toEqual([]);
            });
            it('if the selected key is rdfs:domain', function() {
                this.controller.key = prefixes.rdfs + 'domain';
                _.set(ontologyStateSvc.listItem.selected, this.controller.key + '[0]', {'@id': 'id'});
                ontologyStateSvc.createFlatEverythingTree.and.returnValue([{prop: 'everything'}]);
                ontologyStateSvc.getOntologiesArray.and.returnValue([]);
                this.controller.removeProperty();
                scope.$apply();
                expect(scope.onSubmit).toHaveBeenCalledWith({'@id': 'id'});
                expect(ontologyStateSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                expect(propertyManagerSvc.remove).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, this.controller.key, this.controller.index);
                expect(this.controller.overlayFlag).toBe(false);
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                expect(ontoUtils.updateLabel).toHaveBeenCalled();
                expect(ontologyStateSvc.updatePropertyIcon).not.toHaveBeenCalled();
                expect(ontologyStateSvc.getOntologiesArray).toHaveBeenCalled();
                expect(ontologyStateSvc.createFlatEverythingTree).toHaveBeenCalledWith([], ontologyStateSvc.listItem);
                expect(ontologyStateSvc.listItem.flatEverythingTree).toEqual([{prop: 'everything'}]);
            });
            it('if the selected key is neither rdfs:domain or rdfs:range', function() {
                this.controller.removeProperty();
                scope.$apply();
                expect(scope.onSubmit).toHaveBeenCalledWith({'@id': 'id'});
                expect(ontologyStateSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                expect(propertyManagerSvc.remove).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, this.controller.key, this.controller.index);
                expect(this.controller.overlayFlag).toBe(false);
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                expect(ontoUtils.updateLabel).toHaveBeenCalled();
                expect(ontologyStateSvc.updatePropertyIcon).not.toHaveBeenCalled();
                expect(ontologyStateSvc.getOntologiesArray).not.toHaveBeenCalled();
                expect(ontologyStateSvc.createFlatEverythingTree).not.toHaveBeenCalled();
                expect(ontologyStateSvc.listItem.flatEverythingTree).toEqual([]);
            });
            describe('if the selected value is a blank node', function() {
                beforeEach(function() {
                    ontologyManagerSvc.isBlankNodeId.and.returnValue(true);
                    ontologyStateSvc.removeEntity.and.returnValue([{'@id': 'id'}]);
                    this.expected = {'@id': ontologyStateSvc.listItem.selected['@id']};
                });
                it('and the selected key is rdfs:domain', function() {
                    this.controller.key = prefixes.rdfs + 'domain';
                    _.set(ontologyStateSvc.listItem.selected, this.controller.key + '[0]', {'@id': 'id'});
                    this.expected[this.controller.key] = [{'@id': 'id'}];
                    this.controller.removeProperty();
                    scope.$apply();
                    expect(scope.onSubmit).toHaveBeenCalledWith({'@id': 'id'});
                    expect(ontologyStateSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.expected);
                    expect(ontologyManagerSvc.isBlankNodeId).toHaveBeenCalledWith('id');
                    expect(ontologyStateSvc.removeEntity).toHaveBeenCalledWith(ontologyStateSvc.listItem, 'id');
                    expect(ontologyStateSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, {'@id': 'id'});
                    expect(propertyManagerSvc.remove).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, this.controller.key, this.controller.index);
                    expect(this.controller.overlayFlag).toBe(false);
                    expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                    expect(ontoUtils.updateLabel).toHaveBeenCalled();
                    expect(ontologyStateSvc.updatePropertyIcon).not.toHaveBeenCalled();
                    expect(ontologyStateSvc.getOntologiesArray).not.toHaveBeenCalled();
                    expect(ontologyStateSvc.createFlatEverythingTree).not.toHaveBeenCalled();
                    expect(ontologyStateSvc.listItem.flatEverythingTree).toEqual([]);
                });
                it('and the selected key is not rdf:domain', function() {
                    ontologyStateSvc.listItem.selected[scope.key][scope.index] = {'@id': 'id'};
                    this.expected[scope.key] = [{'@id': 'id'}];
                    this.controller.removeProperty();
                    scope.$apply();
                    expect(scope.onSubmit).toHaveBeenCalledWith({'@id': 'id'});
                    expect(ontologyStateSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.expected);
                    expect(ontologyManagerSvc.isBlankNodeId).toHaveBeenCalledWith('id');
                    expect(ontologyStateSvc.removeEntity).toHaveBeenCalledWith(ontologyStateSvc.listItem, 'id');
                    expect(ontologyStateSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, {'@id': 'id'});
                    expect(propertyManagerSvc.remove).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, this.controller.key, this.controller.index);
                    expect(this.controller.overlayFlag).toBe(false);
                    expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                    expect(ontoUtils.updateLabel).toHaveBeenCalled();
                    expect(ontologyStateSvc.updatePropertyIcon).not.toHaveBeenCalled();
                    expect(ontologyStateSvc.getOntologiesArray).not.toHaveBeenCalled();
                    expect(ontologyStateSvc.createFlatEverythingTree).not.toHaveBeenCalled();
                    expect(ontologyStateSvc.listItem.flatEverythingTree).toEqual([]);
                })
            });
        });
    });
    it('calls removeProperty when the button is clicked', function() {
        spyOn(this.controller, 'removeProperty');
        var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(this.controller.removeProperty).toHaveBeenCalled();
    });
    it('sets the correct state when the cancel button is clicked', function() {
        var button = angular.element(this.element.querySelectorAll('.btn-container button:not(.btn-primary)')[0]);
        button.triggerHandler('click');
        expect(this.controller.overlayFlag).toBe(false);
    });
});