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
    var $compile,
        scope,
        element,
        prefixes,
        stateManagerSvc,
        responseObj;

    beforeEach(function() {
        module('templates');
        module('objectSelect');
        mockPrefixes();
        injectTrustedFilter();
        injectHighlightFilter();
        injectSplitIRIFilter();
        mockOntologyManager();
        mockSettingsManager();
        mockStateManager();
        mockResponseObj();

        inject(function(_ontologyManagerService_, _settingsManagerService_, _responseObj_, _stateManagerService_, _prefixes_) {
            ontologyManagerService = _ontologyManagerService_;
            settingsManagerService = _settingsManagerService_;
            responseObj = _responseObj_;
            stateManagerSvc = _stateManagerService_;
            prefixes = _prefixes_;
        });

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    beforeEach(function() {
        scope.onChange = jasmine.createSpy('onChange');
        scope.displayText = 'test';
        scope.selectList = [];
        scope.mutedText = 'test';
        scope.bindModel = [];
        scope.isDisabledWhen = false;

        element = $compile(angular.element('<object-select on-change="onChange()" display-text="displayText" select-list="selectList" muted-text="mutedText" ng-model="bindModel" is-disabled-when="isDisabledWhen" multi-select="multiSelect"></object-select>'))(scope);
        scope.$digest();
    });

    describe('in isolated scope', function() {
        var isolatedScope;

        beforeEach(function() {
            isolatedScope = element.isolateScope();
        });
        it('displayText should be two way bound', function() {
            isolatedScope.displayText = 'new';
            scope.$digest();
            expect(scope.displayText).toEqual('new');
        });
        it('mutedText should be two way bound', function() {
            isolatedScope.mutedText = 'new';
            scope.$digest();
            expect(scope.mutedText).toEqual('new');
        });
        it('selectList should be two way bound', function() {
            isolatedScope.selectList = ['new'];
            scope.$digest();
            expect(scope.selectList).toEqual(['new']);
        });
        it('onChange should be called in parent scope', function() {
            isolatedScope.onChange();
            expect(scope.onChange).toHaveBeenCalled();
        });
    });
    describe('controller bound variables', function() {
        var controller;

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
        it('for a DIV', function() {
            expect(element.prop('tagName')).toBe('DIV');
        });
        it('based on overlay form group', function() {
            expect(element.hasClass('form-group')).toBe(true);
        });
        it('based on custom label tags', function() {
            var labels = element.querySelectorAll('custom-label');
            expect(labels.length).toBe(1);
        });
        describe('based on ui select tags', function() {
            it('if it is a multi select', function() {
                scope.multiSelect = true;
                scope.$digest();
                var selects = element.querySelectorAll('ui-select');
                expect(selects.length).toBe(1);
                expect(angular.element(selects[0]).attr('multiple')).toBeDefined();
            });
            it('if it is not a multi select', function() {
                scope.multiSelect = false;
                scope.$digest();
                var selects = element.querySelectorAll('ui-select');
                expect(selects.length).toBe(1);
                expect(angular.element(selects[0]).attr('multiple')).toBeUndefined();
            });
        });
    });
    describe('controller methods', function() {
        var controller;

        beforeEach(function() {
            stateManagerSvc.state = {ontologyId: 'ontologyId'};
            controller = element.controller('objectSelect');
        });
        describe('getItemOntologyIri', function() {
            it('should return ontologyId if nothing is passed in', function() {
                var result = controller.getItemOntologyIri();
                expect(result).toEqual('ontologyId');
            });
            it('should return item.ontologyIri if provided', function() {
                var result = controller.getItemOntologyIri({ontologyId: 'new'});
                expect(result).toEqual('new');
            });
            it('should return ontologyId if object does not have ontologyIri property.', function() {
                var result = controller.getItemOntologyIri({prop: 'new'});
                expect(result).toEqual('ontologyId');
            });
        });
        describe('getItemIri', function() {
            it('should call responseObj.getItemIri if nothing is passed in', function() {
                var result = controller.getItemIri();
                expect(responseObj.getItemIri).toHaveBeenCalled();
            });
            it('should return item["@id"] if it has that property', function() {
                var result = controller.getItemIri({'@id': 'new'});
                expect(result).toEqual('new');
            });
            it('should call responseObj.getItemIri if object does not have @id property.', function() {
                var result = controller.getItemIri({prop: 'new'});
                expect(responseObj.getItemIri).toHaveBeenCalled();
            });
        });
        describe('getTooltipDisplay', function() {
            beforeEach(function() {
                spyOn(controller, 'getItemIri').and.returnValue('test');
            });
            it('should return @id when tooltipDisplay is empty', function() {
                ontologyManagerService.getEntity.and.returnValue({'@id': 'id'});
                var result = controller.getTooltipDisplay();
                expect(result).toBe('id');
            });
            describe('for comment', function() {
                beforeEach(function() {
                    controller.tooltipDisplay = 'comment';
                });
                it('should return rdfs:comment before dcterms:description and dc:description', function() {
                    var selectedObject = {'@id': 'id'};
                    selectedObject[prefixes.rdfs + 'comment'] = [{'@value': 'comment'}];
                    selectedObject[prefixes.dcterms + 'description'] = [{'@value': 'description'}];
                    selectedObject[prefixes.dc + 'description'] = [{'@value': 'description'}];

                    ontologyManagerService.getEntity.and.returnValue(selectedObject);
                    var result = controller.getTooltipDisplay();
                    expect(result).toBe(selectedObject[prefixes.rdfs + 'comment'][0]['@value']);
                });
                it('should return dcterms:description before dc:description if no rdfs:comment', function() {
                    var selectedObject = {'@id': 'id'};
                    selectedObject[prefixes.dcterms + 'description'] = [{'@value': 'description'}];
                    selectedObject[prefixes.dc + 'description'] = [{'@value': 'description'}];

                    ontologyManagerService.getEntity.and.returnValue(selectedObject);
                    var result = controller.getTooltipDisplay();
                    expect(result).toBe(selectedObject[prefixes.dcterms + 'description'][0]['@value']);
                });
                it('should return dc:description if no rdfs:comment or dcterms:description', function() {
                    var selectedObject = {'@id': 'id'};
                    selectedObject[prefixes.dc + 'description'] = [{'@value': 'description'}];

                    ontologyManagerService.getEntity.and.returnValue(selectedObject);
                    var result = controller.getTooltipDisplay();
                    expect(result).toBe(selectedObject[prefixes.dc + 'description'][0]['@value']);
                });
                it('should return controller.getItemIri if no dc:description or dcterms:description or rdfs:comment', function() {
                    controller.getItemIri = jasmine.createSpy('getItemIri').and.returnValue('iri');
                    ontologyManagerService.getEntity.and.returnValue({});
                    var result = controller.getTooltipDisplay();
                    expect(result).toBe('iri');
                });
            });
            describe('for label', function() {
                beforeEach(function() {
                    controller.tooltipDisplay = 'label';
                });
                it('should return rdfs:label before dcterms:title or dc:title', function() {
                    var selectedObject = {'@id': 'id'};
                    selectedObject[prefixes.rdfs + 'label'] = [{'@value': 'label'}];
                    selectedObject[prefixes.dcterms + 'title'] = [{'@value': 'title'}];
                    selectedObject[prefixes.dc + 'title'] = [{'@value': 'title'}];

                    ontologyManagerService.getEntity.and.returnValue(selectedObject);
                    var result = controller.getTooltipDisplay();
                    expect(result).toBe(selectedObject[prefixes.rdfs + 'label'][0]['@value']);
                });
                it('should return dcterms:title before dc:title if no rdfs:label', function() {
                    var selectedObject = {'@id': 'id'};
                    selectedObject[prefixes.dcterms + 'title'] = [{'@value': 'title'}];
                    selectedObject[prefixes.dc + 'title'] = [{'@value': 'title'}];

                    ontologyManagerService.getEntity.and.returnValue(selectedObject);
                    var result = controller.getTooltipDisplay();
                    expect(result).toBe(selectedObject[prefixes.dcterms + 'title'][0]['@value']);
                });
                it('should return dc:title if no rdfs:label or dcterms:title', function() {
                    var selectedObject = {'@id': 'id'};
                    selectedObject[prefixes.dc + 'title'] = [{'@value': 'title'}];

                    ontologyManagerService.getEntity.and.returnValue(selectedObject);
                    var result = controller.getTooltipDisplay();
                    expect(result).toBe(selectedObject[prefixes.dc + 'title'][0]['@value']);
                });
                it('should return controller.getItemIri if no dc:title or dcterms:title or rdfs:label', function() {
                    controller.getItemIri = jasmine.createSpy('getItemIri').and.returnValue('iri');
                    ontologyManagerService.getEntity.and.returnValue({});
                    var result = controller.getTooltipDisplay();
                    expect(result).toBe('iri');
                });
            });
        });
        describe('isBlankNode should return', function() {
            it('false for falsey values', function() {
                _.forEach([undefined, null, [], true], function(item) {
                    expect(controller.isBlankNode(item)).toBe(false);
                });
            });
            it('true for strings containing "_:b"', function() {
                _.forEach(['_:b', '_:b1', 'stuff_:b'], function(item) {
                    expect(controller.isBlankNode(item)).toBe(true);
                });
            });
        });
        describe('getBlankNodeValue should return', function() {
            beforeEach(function() {
                stateManagerSvc.state.blankNodes = {
                    '_:b1': 'prop',
                    '_:b2': 'class',
                    '_:b3': 'union',
                    '_:b4': 'intersection'
                }
                scope.$digest();
            });
            it('undefined if isBlankNode returns false', function() {
                spyOn(controller, 'isBlankNode').and.returnValue(false);
                var result = controller.getBlankNodeValue();
                expect(result).toBe(undefined);
            });
            it('id if isBlankNode returns true and id does not match any property', function() {
                spyOn(controller, 'isBlankNode').and.returnValue(true);
                _.forEach(['_:b11', '_:b22', 'test', ''], function(item) {
                    var result = controller.getBlankNodeValue(item);
                    expect(result).toBe(item);
                });
            });
            it('property name when id does match property', function() {
                spyOn(controller, 'isBlankNode').and.returnValue(true);
                var tests = [
                    {id: '_:b1', result: 'prop'},
                    {id: '_:b2', result: 'class'},
                    {id: '_:b3', result: 'union'},
                    {id: '_:b4', result: 'intersection'}
                ];
                _.forEach(tests, function(item) {
                    var result = controller.getBlankNodeValue(item.id);
                    expect(result).toBe(item.result);
                });
            });
        });
    });
});
