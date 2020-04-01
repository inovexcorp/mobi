/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
    mockOntologyState,
    mockOntologyManager
} from '../../../../../../test/js/Shared';

describe('Characteristics Row component', function() {
    var $compile, scope, ontologyManagerSvc, ontologyStateSvc;

    beforeEach(function() {
        angular.mock.module('ontology-editor');
        mockComponent('ontology-editor', 'characteristicsBlock');
        mockOntologyManager();
        mockOntologyState();

        inject(function(_$compile_, _$rootScope_, _ontologyManagerService_, _ontologyStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyManagerSvc = _ontologyManagerService_;
            ontologyStateSvc = _ontologyStateService_;
        });

        this.element = $compile(angular.element('<characteristics-row></characteristics-row>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('characteristicsRow');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyManagerSvc = null;
        ontologyStateSvc = null;
        this.element.remove();
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('CHARACTERISTICS-ROW');
            expect(this.element.querySelectorAll('.characteristics-row').length).toEqual(1);
        });
        describe('when selected is not an object or data property', function() {
            it('for a row', function() {
                expect(this.element.querySelectorAll('.row').length).toEqual(0);
            });
            it('for a characteristics-block', function() {
                expect(this.element.find('characteristics-block').length).toEqual(0);
            });
        });
        describe('when selected is an object property', function() {
            beforeEach(function() {
                ontologyManagerSvc.isObjectProperty.and.returnValue(true);
                ontologyManagerSvc.isDataTypeProperty.and.returnValue(false);
                scope.$apply();
            });
            it('for a row', function() {
                expect(this.element.querySelectorAll('.row').length).toEqual(1);
            });
            it('for a characteristics-block', function() {
                expect(this.element.find('characteristics-block').length).toEqual(1);
            });
        });
        describe('when selected is a data property', function() {
            beforeEach(function() {
                ontologyManagerSvc.isObjectProperty.and.returnValue(false);
                ontologyManagerSvc.isDataTypeProperty.and.returnValue(true);
                scope.$apply();
            });
            it('for a row', function() {
                expect(this.element.querySelectorAll('.row').length).toEqual(1);
            });
            it('for a characteristics-block', function() {
                expect(this.element.find('characteristics-block').length).toEqual(1);
            });
        });
    });
    describe('controller methods', function() {
        it('update the types of the selected object', function() {
            this.object = {};
            ontologyStateSvc.getEntityByRecordId.and.returnValue(this.object);
            this.controller.updateTypes(['test']);
            expect(ontologyStateSvc.getEntityByRecordId).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.selected['@id']);
            expect(ontologyStateSvc.listItem.selected['@types']).toEqual(['test']);
            expect(this.object['@types']).toEqual(['test']);
        });
    });
});
