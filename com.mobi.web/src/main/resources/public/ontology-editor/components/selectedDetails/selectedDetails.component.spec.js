/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import {
    mockComponent,
    mockOntologyManager,
    mockOntologyState,
    mockOntologyUtilsManager,
    mockManchesterConverter,
    mockModal,
    injectPrefixationFilter
} from '../../../../../../test/js/Shared';

describe('Selected Details component', function() {
    var $compile, scope, $q, ontologyStateSvc, ontologyManagerSvc, ontoUtils, manchesterConverterSvc, modalSvc;

    beforeEach(function() {
        angular.mock.module('ontology-editor');
        mockComponent('ontology-editor', 'staticIri');
        mockOntologyManager();
        mockOntologyState();
        mockOntologyUtilsManager();
        mockManchesterConverter();
        mockModal();
        injectPrefixationFilter();

        inject(function(_$compile_, _$rootScope_, _$q_, _ontologyStateService_, _ontologyManagerService_, _ontologyUtilsManagerService_, _manchesterConverterService_, _modalService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyManagerSvc = _ontologyManagerService_;
            manchesterConverterSvc = _manchesterConverterService_;
            ontoUtils = _ontologyUtilsManagerService_; // TODO when upgraded to angular, code was moved into ontologyStateService
            modalSvc = _modalService_;
        });

        ontologyStateSvc.canModify.and.returnValue(true);
        scope.readOnly = false;
        scope.highlightText = '';
        this.element = $compile(angular.element('<selected-details read-only="readOnly" highlight-text="highlightText"></selected-details>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('selectedDetails');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        ontologyStateSvc = null;
        ontologyManagerSvc = null;
        ontoUtils = null;
        manchesterConverterSvc = null;
        modalSvc = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('readOnly is one way bound', function() {
            this.controller.readOnly = true;
            scope.$digest();
            expect(scope.readOnly).toEqual(false);
        });
        it('highlightText is one way bound', function() {
            this.controller.highlightText = 'new text';
            scope.$digest();
            expect(scope.highlightText).toEqual('');
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('SELECTED-DETAILS');
            expect(this.element.querySelectorAll('.selected-details').length).toEqual(1);
        });
        it('depending on whether something is selected', function() {
            expect(this.element.querySelectorAll('.selected-heading').length).toEqual(1);
            expect(this.element.find('static-iri').length).toEqual(1);

            ontologyStateSvc.listItem.selected = undefined;
            scope.$digest();
            expect(this.element.querySelectorAll('.selected-heading').length).toEqual(0);
            expect(this.element.find('static-iri').length).toEqual(0);
        });
        it('depending on whether the selected entity has types', function() {
            expect(this.element.querySelectorAll('.type-wrapper').length).toEqual(0);
            ontologyStateSvc.listItem.selected['@type'] = ['test'];
            scope.$digest();
            expect(this.element.querySelectorAll('.type-wrapper').length).toEqual(1);
        });
        it('depending on whether the details should be read only', function() {
            ontologyManagerSvc.isIndividual.and.returnValue(true);
            ontologyStateSvc.listItem.selected['@type'] = ['test'];
            scope.$digest();
            expect(this.element.find('static-iri').length).toEqual(1);
            expect(this.element.find('a').length).toEqual(1);
            scope.readOnly = true;
            scope.$digest();
            expect(this.element.find('static-iri').length).toEqual(1);
            expect(this.element.find('a').length).toEqual(0);
        });
        it('depending on whether the entity is an individual', function() {
            ontologyManagerSvc.isIndividual.and.returnValue(false);
            ontologyStateSvc.listItem.selected['@type'] = ['test'];
            scope.$digest();
            expect(this.element.find('a').length).toEqual(0);
            ontologyManagerSvc.isIndividual.and.returnValue(true);
            scope.$digest();
            expect(this.element.find('a').length).toEqual(1);
        });
        it('when selected imported is true', function() {
            ontologyStateSvc.listItem.entityInfo = {
                'id1': { imported: true, ontologyId: 'ont1' }
            }
            ontologyStateSvc.listItem.selected = { '@id': 'id1' };
            expect(this.controller.isFromImportedOntology()).toEqual(true);
            expect(this.controller.getImportedOntology()).toEqual('ont1');
            scope.$digest();
            expect(this.element.querySelectorAll('.is-imported-ontology').length).toEqual(1);
            expect(this.element.querySelectorAll('.imported-ontology').text()).toEqual('ont1');
            ontologyStateSvc.listItem.entityInfo = {
                'id1': { imported: false, ontologyId: 'ont1' }
            }
            scope.$digest();
            expect(this.element.querySelectorAll('.is-imported-ontology').length).toEqual(0);
        });
    });
    describe('controller methods', function() {
        describe('isFromImportedOntology functions properly', function() {
            it('when selected is empty', function() {
                ontologyStateSvc.listItem.selected = {};
                expect(this.controller.isFromImportedOntology()).toEqual(false);
            });
            it('when selected imported is false', function() {
                ontologyStateSvc.listItem.entityInfo = {
                    'id1': { imported: false }
                }
                ontologyStateSvc.listItem.selected = { '@id': 'id1' };
                expect(this.controller.isFromImportedOntology()).toEqual(false);
            });
            it('when selected imported is false and entityInfo empty', function() {
                ontologyStateSvc.listItem.entityInfo = {
                    'id1': { }
                }
                ontologyStateSvc.listItem.selected = { '@id': 'id1' };
                expect(this.controller.isFromImportedOntology()).toEqual(false);
            });
            it('when selected imported is true', function() {
                ontologyStateSvc.listItem.entityInfo = {
                    'id1': { imported: true }
                }
                ontologyStateSvc.listItem.selected = { '@id': 'id1' };
                expect(this.controller.isFromImportedOntology()).toEqual(true);
            });
        });
        describe('getImportedOntology functions properly', function() {
            it('when selected is empty', function() {
                ontologyStateSvc.listItem.selected = {};
                expect(this.controller.getImportedOntology()).toEqual('');
            });
            it('when selected and entityInfo is correct', function() {
                ontologyStateSvc.listItem.entityInfo = {
                    'id1': { imported: false, ontologyId: 'ont1'},
                }
                ontologyStateSvc.listItem.selected = { '@id': 'id1' };
                expect(this.controller.getImportedOntology()).toEqual('ont1');
            });
            it('when selected and entityInfo is empty', function() {
                ontologyStateSvc.listItem.entityInfo = {
                    'id1': { imported: false}
                }
                ontologyStateSvc.listItem.selected = { '@id': 'id1' };
                expect(this.controller.getImportedOntology()).toEqual('');
            });
        });
        describe('getTypes functions properly', function() {
            it('when @type is empty', function() {
                ontologyStateSvc.listItem.selected = {};
                expect(this.controller.getTypes()).toEqual('');
            });
            it('when @type has items', function() {
                var expected = 'test, test2';
                ontologyStateSvc.listItem.selected = {'@type': ['test', 'test2']};
                expect(this.controller.getTypes()).toEqual(expected);
            });
            it('when @type has blank node items', function() {
                ontologyStateSvc.listItem.selectedBlankNodes = [];
                ontologyStateSvc.getBnodeIndex.and.returnValue({});
                ontologyManagerSvc.isBlankNodeId.and.returnValue(true);
                ontologyStateSvc.listItem.selected = {'@type': ['test', 'test2']};
                this.controller.getTypes();
                expect(manchesterConverterSvc.jsonldToManchester).toHaveBeenCalledWith(jasmine.any(String), ontologyStateSvc.listItem.selectedBlankNodes, {});
                expect(ontologyStateSvc.getBnodeIndex).toHaveBeenCalled();
            });
        });
        describe('onEdit calls the proper functions', function() {
            it('when ontologyState.onEdit resolves', function() {
                ontologyStateSvc.onEdit.and.returnValue($q.when());
                this.controller.onEdit('begin', 'middle', 'end');
                scope.$apply();
                expect(ontologyStateSvc.onEdit).toHaveBeenCalledWith('begin', 'middle', 'end');
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                expect(ontoUtils.updateLabel).toHaveBeenCalled();
            });
            it('when ontologyState.onEdit rejects', function() {
                ontologyStateSvc.onEdit.and.returnValue($q.reject());
                this.controller.onEdit('begin', 'middle', 'end');
                scope.$apply();
                expect(ontologyStateSvc.onEdit).toHaveBeenCalledWith('begin', 'middle', 'end');
                expect(ontoUtils.saveCurrentChanges).not.toHaveBeenCalled();
                expect(ontoUtils.updateLabel).not.toHaveBeenCalled();
            });
        });
        it('should open the individual types modal', function() {
            this.controller.showTypesOverlay();
            expect(modalSvc.openModal).toHaveBeenCalledWith('individualTypesModal');
        });
    });
});
