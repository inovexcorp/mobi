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
describe('Open Entity Snackbar component', function() {
    var $compile, scope, $timeout, ontologyStateSvc;

    beforeEach(function() {
        module('templates');
        module('ontology-editor');
        mockOntologyState();

        inject(function(_$compile_, _$rootScope_, _$timeout_, _ontologyStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $timeout = _$timeout_;
            ontologyStateSvc = _ontologyStateService_;
        });

        ontologyStateSvc.listItem.goTo.entityIRI = 'iri';
        ontologyStateSvc.listItem.goTo.active = true;
        ontologyStateSvc.getEntityNameByIndex.and.returnValue('Entity Name');

        scope.iri = 'iri';
        this.element = $compile(angular.element('<open-entity-snackbar iri="iri"></open-entity-snackbar>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('openEntitySnackbar');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        this.element.remove();
    });

    describe('initializes with the correct values', function() {
        it('for show, entityName and goTo', function() {
            $timeout.flush();
            expect(this.controller.entityName).toEqual('Entity Name');
            expect(this.controller.show).toEqual(true);
            expect(ontologyStateSvc.listItem.goTo.entityIRI).toEqual('iri');
            expect(ontologyStateSvc.listItem.goTo.active).toEqual(true);
            $timeout.flush();
            expect(this.controller.show).toEqual(false);
            $timeout.flush();
            expect(ontologyStateSvc.listItem.goTo.entityIRI).toEqual('');
            expect(ontologyStateSvc.listItem.goTo.active).toEqual(false);
        });
    });
    describe('controller methods', function() {
        it('openEntity calls ontologyStateService goTo and closes the snackbar', function() {
            this.controller.openEntity();
            expect(ontologyStateSvc.goTo).toHaveBeenCalledWith('iri');
            expect(this.controller.show).toEqual(false);
            expect(ontologyStateSvc.listItem.goTo.entityIRI).toEqual('iri');
            expect(ontologyStateSvc.listItem.goTo.active).toEqual(true);
            $timeout.flush();
            expect(ontologyStateSvc.listItem.goTo.entityIRI).toEqual('');
            expect(ontologyStateSvc.listItem.goTo.active).toEqual(false);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('OPEN-ENTITY-SNACKBAR');
            expect(this.element.querySelectorAll('.snackbar-body').length).toEqual(1);
            expect(this.element.querySelectorAll('.snackbar-btn').length).toEqual(1);
        });
    });
});
