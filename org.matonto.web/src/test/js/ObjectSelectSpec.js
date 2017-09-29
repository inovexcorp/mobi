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
describe('Object Select directive', function() {
    var $compile, scope, element, isolatedScope, controller, prefixes, ontologyStateSvc, ontologyManagerSvc, responseObj;

    beforeEach(function() {
        module('templates');
        module('objectSelect');
        injectTrustedFilter();
        injectHighlightFilter();
        injectSplitIRIFilter();
        mockOntologyManager();
        mockSettingsManager();
        mockOntologyState();
        mockResponseObj();
        mockPrefixes();
        mockOntologyUtilsManager();

        inject(function(_$compile_, _$rootScope_, _ontologyManagerService_, _settingsManagerService_, _responseObj_, _ontologyStateService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyManagerSvc = _ontologyManagerService_;
            settingsManagerService = _settingsManagerService_;
            responseObj = _responseObj_;
            ontologyStateSvc = _ontologyStateService_;
            prefixes = _prefixes_;
        });

        scope.displayText = 'test';
        scope.selectList = [];
        scope.mutedText = 'test';
        scope.isDisabledWhen = false;
        scope.isRequiredWhen = false;
        scope.multiSelect = false;
        scope.onChange = jasmine.createSpy('onChange');
        scope.bindModel = [];

        element = $compile(angular.element('<object-select multi-select="multiSelect" on-change="onChange()" display-text="displayText" select-list="selectList" muted-text="mutedText" ng-model="bindModel" is-disabled-when="isDisabledWhen" multi-select="multiSelect"></object-select>'))(scope);
        scope.$digest();
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            isolatedScope = element.isolateScope();
        });
        it('displayText should be one way bound', function() {
            isolatedScope.displayText = 'new';
            scope.$digest();
            expect(scope.displayText).toEqual('test');
        });
        it('selectList should be one way bound', function() {
            isolatedScope.selectList = ['new'];
            scope.$digest();
            expect(scope.selectList).toEqual([]);
        });
        it('isDisabledWhen should be one way bound', function() {
            isolatedScope.isDisabledWhen = true;
            scope.$digest();
            expect(scope.isDisabledWhen).toEqual(false);
        });
        it('isRequiredWhen should be one way bound', function() {
            isolatedScope.isRequiredWhen = true;
            scope.$digest();
            expect(scope.isRequiredWhen).toEqual(false);
        });
        it('multiSelect should be one way bound', function() {
            isolatedScope.multiSelect = true;
            scope.$digest();
            expect(scope.multiSelect).toEqual(false);
        });
        it('mutedText should be one way bound', function() {
            isolatedScope.mutedText = 'new';
            scope.$digest();
            expect(scope.mutedText).toEqual('test');
        });
        it('onChange should be called in parent scope', function() {
            isolatedScope.onChange();
            expect(scope.onChange).toHaveBeenCalled();
        });
    });
    describe('controller bound variable', function() {
        beforeEach(function() {
            controller = element.controller('objectSelect');
        });
        it('bindModel should be two way bound', function() {
            controller.bindModel = ['new'];
            scope.$digest();
            expect(scope.bindModel).toEqual(['new']);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('object-select')).toBe(true);
            expect(element.hasClass('form-group')).toBe(true);
        });
        it('with custom-labels', function() {
            expect(element.querySelectorAll('custom-label').length).toBe(1);
        });
        it('depending on whether it is a multi select', function() {
            var selects = element.querySelectorAll('ui-select');
            expect(selects.length).toBe(1);
            expect(angular.element(selects[0]).attr('multiple')).toBeUndefined();

            scope.multiSelect = true;
            scope.$digest();
            selects = element.querySelectorAll('ui-select');
            expect(selects.length).toBe(1);
            expect(angular.element(selects[0]).attr('multiple')).toBeDefined();
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            ontologyStateSvc.listItem.ontologyId = 'ontologyId';
            controller = element.controller('objectSelect');
        });
        describe('getItemOntologyIri', function() {
            it('should return ontologyId if nothing is passed in', function() {
                expect(controller.getItemOntologyIri()).toEqual('ontologyId');
            });
            it('should return item.ontologyIri if provided', function() {
                expect(controller.getItemOntologyIri({ontologyId: 'new'})).toEqual('new');
            });
            it('should return ontologyId if object does not have ontologyIri property.', function() {
                expect(controller.getItemOntologyIri({prop: 'new'})).toEqual('ontologyId');
            });
        });
        describe('getItemIri', function() {
            it('should call responseObj.getItemIri if nothing is passed in', function() {
                var result = controller.getItemIri();
                expect(responseObj.getItemIri).toHaveBeenCalled();
            });
            it('should return item["@id"] if it has that property', function() {
                expect(controller.getItemIri({'@id': 'new'})).toEqual('new');
            });
            it('should call responseObj.getItemIri if object does not have @id property.', function() {
                var result = controller.getItemIri({prop: 'new'});
                expect(responseObj.getItemIri).toHaveBeenCalled();
            });
        });
        describe('getTooltipDisplay', function() {
            beforeEach(function() {
                ontologyStateSvc.getEntityByRecordId.and.returnValue({});
                spyOn(controller, 'getItemIri').and.returnValue('test');
            });
            it('should return @id when tooltipDisplay is empty', function() {
                ontologyStateSvc.getEntityByRecordId.and.returnValue({'@id': 'id'});
                var result = controller.getTooltipDisplay();
                expect(result).toBe('id');
            });
            describe('for comment', function() {
                beforeEach(function() {
                    controller.tooltipDisplay = 'comment';
                });
                it('when getEntityDescription is undefined', function() {
                    ontologyManagerSvc.getEntityDescription.and.returnValue(undefined);
                    var result = controller.getTooltipDisplay();
                    expect(ontologyManagerSvc.getEntityDescription).toHaveBeenCalledWith({}); // The value of getEntity
                    expect(result).toEqual('test'); // The value of getItemIri
                });
                it('when getEntityDescription is defined', function() {
                    ontologyManagerSvc.getEntityDescription.and.returnValue('new');
                    var result = controller.getTooltipDisplay();
                    expect(ontologyManagerSvc.getEntityDescription).toHaveBeenCalledWith({}); // The value of getEntity
                    expect(result).toEqual('new'); // The value of getItemIri
                });
            });
            describe('for label', function() {
                beforeEach(function() {
                    controller.tooltipDisplay = 'label';
                });
                it('when getEntityName is undefined', function() {
                    ontologyManagerSvc.getEntityName.and.returnValue(undefined);
                    var result = controller.getTooltipDisplay();
                    expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith({}, ontologyStateSvc.listItem.ontologyRecord.type); // The value of getEntity
                    expect(result).toEqual('test'); // The value of getItemIri
                });
                it('when getEntityName is defined', function() {
                    ontologyManagerSvc.getEntityName.and.returnValue('new');
                    var result = controller.getTooltipDisplay();
                    expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith({}, ontologyStateSvc.listItem.ontologyRecord.type); // The value of getEntity
                    expect(result).toEqual('new'); // The value of getItemIri
                });
            });
        });
    });
});
