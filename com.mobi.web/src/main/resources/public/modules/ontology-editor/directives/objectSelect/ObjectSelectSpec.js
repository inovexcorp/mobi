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
describe('Object Select directive', function() {
    var $compile, scope, prefixes, ontologyStateSvc, ontologyManagerSvc, responseObj;

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

        this.element = $compile(angular.element('<object-select multi-select="multiSelect" on-change="onChange()" display-text="displayText" select-list="selectList" muted-text="mutedText" ng-model="bindModel" is-disabled-when="isDisabledWhen" multi-select="multiSelect"></object-select>'))(scope);
        scope.$digest();
        this.isolatedScope = this.element.isolateScope();
        this.controller = this.element.controller('objectSelect');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        prefixes = null;
        ontologyStateSvc = null;
        ontologyManagerSvc = null;
        responseObj = null;
        this.element.remove();
    });

    describe('in isolated scope', function() {
        it('displayText should be one way bound', function() {
            this.isolatedScope.displayText = 'new';
            scope.$digest();
            expect(scope.displayText).toEqual('test');
        });
        it('selectList should be one way bound', function() {
            this.isolatedScope.selectList = ['new'];
            scope.$digest();
            expect(scope.selectList).toEqual([]);
        });
        it('isDisabledWhen should be one way bound', function() {
            this.isolatedScope.isDisabledWhen = true;
            scope.$digest();
            expect(scope.isDisabledWhen).toEqual(false);
        });
        it('isRequiredWhen should be one way bound', function() {
            this.isolatedScope.isRequiredWhen = true;
            scope.$digest();
            expect(scope.isRequiredWhen).toEqual(false);
        });
        it('multiSelect should be one way bound', function() {
            this.isolatedScope.multiSelect = true;
            scope.$digest();
            expect(scope.multiSelect).toEqual(false);
        });
        it('mutedText should be one way bound', function() {
            this.isolatedScope.mutedText = 'new';
            scope.$digest();
            expect(scope.mutedText).toEqual('test');
        });
        it('onChange should be called in parent scope', function() {
            this.isolatedScope.onChange();
            expect(scope.onChange).toHaveBeenCalled();
        });
    });
    describe('controller bound variable', function() {
        it('bindModel should be two way bound', function() {
            this.controller.bindModel = ['new'];
            scope.$digest();
            expect(scope.bindModel).toEqual(['new']);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('object-select')).toBe(true);
            expect(this.element.hasClass('form-group')).toBe(true);
        });
        it('with custom-labels', function() {
            expect(this.element.querySelectorAll('custom-label').length).toBe(1);
        });
        it('depending on whether it is a multi select', function() {
            var selects = this.element.querySelectorAll('ui-select');
            expect(selects.length).toBe(1);
            expect(angular.element(selects[0]).attr('multiple')).toBeUndefined();

            scope.multiSelect = true;
            scope.$digest();
            selects = this.element.querySelectorAll('ui-select');
            expect(selects.length).toBe(1);
            expect(angular.element(selects[0]).attr('multiple')).toBeDefined();
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            ontologyStateSvc.listItem.ontologyId = 'ontologyId';
        });
        describe('getItemOntologyIri', function() {
            it('should return ontologyId if nothing is passed in', function() {
                expect(this.controller.getItemOntologyIri()).toEqual('ontologyId');
            });
            it('should return item.ontologyIri if provided', function() {
                expect(this.controller.getItemOntologyIri({ontologyId: 'new'})).toEqual('new');
            });
            it('should return ontologyId if object does not have ontologyIri property.', function() {
                expect(this.controller.getItemOntologyIri({prop: 'new'})).toEqual('ontologyId');
            });
        });
        describe('getItemIri', function() {
            it('should call responseObj.getItemIri if nothing is passed in', function() {
                var result = this.controller.getItemIri();
                expect(responseObj.getItemIri).toHaveBeenCalled();
            });
            it('should return item["@id"] if it has that property', function() {
                expect(this.controller.getItemIri({'@id': 'new'})).toEqual('new');
            });
            it('should call responseObj.getItemIri if object does not have @id property.', function() {
                var result = this.controller.getItemIri({prop: 'new'});
                expect(responseObj.getItemIri).toHaveBeenCalled();
            });
        });
        describe('getTooltipDisplay', function() {
            beforeEach(function() {
                ontologyStateSvc.getEntityByRecordId.and.returnValue({});
                spyOn(this.controller, 'getItemIri').and.returnValue('test');
            });
            it('should return @id when tooltipDisplay is empty', function() {
                ontologyStateSvc.getEntityByRecordId.and.returnValue({'@id': 'id'});
                var result = this.controller.getTooltipDisplay();
                expect(result).toBe('id');
            });
            describe('for comment', function() {
                beforeEach(function() {
                    this.controller.tooltipDisplay = 'comment';
                });
                it('when getEntityDescription is undefined', function() {
                    ontologyManagerSvc.getEntityDescription.and.returnValue(undefined);
                    var result = this.controller.getTooltipDisplay();
                    expect(ontologyManagerSvc.getEntityDescription).toHaveBeenCalledWith({}); // The value of getEntity
                    expect(result).toEqual('test'); // The value of getItemIri
                });
                it('when getEntityDescription is defined', function() {
                    ontologyManagerSvc.getEntityDescription.and.returnValue('new');
                    var result = this.controller.getTooltipDisplay();
                    expect(ontologyManagerSvc.getEntityDescription).toHaveBeenCalledWith({}); // The value of getEntity
                    expect(result).toEqual('new'); // The value of getItemIri
                });
            });
            describe('for label', function() {
                beforeEach(function() {
                    this.controller.tooltipDisplay = 'label';
                });
                it('when getEntityName is undefined', function() {
                    ontologyManagerSvc.getEntityName.and.returnValue(undefined);
                    var result = this.controller.getTooltipDisplay();
                    expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith({}); // The value of getEntity
                    expect(result).toEqual('test'); // The value of getItemIri
                });
                it('when getEntityName is defined', function() {
                    ontologyManagerSvc.getEntityName.and.returnValue('new');
                    var result = this.controller.getTooltipDisplay();
                    expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith({}); // The value of getEntity
                    expect(result).toEqual('new'); // The value of getItemIri
                });
            });
        });
    });
});
