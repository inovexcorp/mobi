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
    mockOntologyState
} from '../../../../../../test/js/Shared';

describe('Open Entity Snackbar component', function() {
    var $compile, scope, $timeout, ontologyStateSvc;

    beforeEach(function() {
        angular.mock.module('ontology-editor');
        mockOntologyState();

        inject(function(_$compile_, _$rootScope_, _$timeout_, _ontologyStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $timeout = _$timeout_;
            ontologyStateSvc = _ontologyStateService_;
        });

        ontologyStateSvc.listItem.goTo.entityIRI = 'iri';
        ontologyStateSvc.listItem.goTo.active = true;
        ontologyStateSvc.getEntityNameByListItem.and.callFake(function(entityIRI) {
            if (entityIRI === 'iri') {
                return 'Entity Name';
            } else if (entityIRI === 'newIRI') {
                return 'New Entity Name'
            }
        });

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

    describe('controller bound variable', function() {
        it('iri is one way bound', function() {
            this.controller.iri = 'newIRI';
            scope.$digest();
            expect(scope.iri).toEqual('iri');
        });
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
        it('$onChanges resets the snackbar and cancels previous timeout', function() {
            spyOn($timeout, 'cancel');
            ontologyStateSvc.listItem.goTo.entityIRI = 'newIRI';
            scope.iri = 'newIRI';
            scope.$apply();
            expect(this.controller.show).toEqual(false);
            expect(this.controller.entityName).toEqual('Entity Name');
            expect($timeout.cancel).toHaveBeenCalledWith(this.controller.closeTimeout);
            $timeout.flush();
            expect(this.controller.entityName).toEqual('New Entity Name');
            expect(this.controller.show).toEqual(true);
            expect(ontologyStateSvc.listItem.goTo.entityIRI).toEqual('newIRI');
            expect(ontologyStateSvc.listItem.goTo.active).toEqual(true);
            $timeout.flush();
            expect(this.controller.show).toEqual(false);
            $timeout.flush();
            expect(ontologyStateSvc.listItem.goTo.entityIRI).toEqual('');
            expect(ontologyStateSvc.listItem.goTo.active).toEqual(false);
        });
        it('$onDestroy resets the state of listItem.goTo if present', function() {
            spyOn($timeout, 'cancel');
            this.controller.$onDestroy();
            expect($timeout.cancel).toHaveBeenCalledWith(this.controller.closeTimeout);
            expect($timeout.cancel).toHaveBeenCalledWith(this.controller.resetStateTimeout);
            expect(ontologyStateSvc.listItem.goTo.entityIRI).toEqual('');
            expect(ontologyStateSvc.listItem.goTo.active).toEqual(false);
        });
        it('openEntity calls ontologyStateService goTo and closes the snackbar', function() {
            spyOn($timeout, 'cancel');
            this.controller.openEntity();
            expect(ontologyStateSvc.goTo).toHaveBeenCalledWith('iri');
            expect($timeout.cancel).toHaveBeenCalledWith(this.controller.closeTimeout);
            expect(this.controller.show).toEqual(false);
            expect(ontologyStateSvc.listItem.goTo.entityIRI).toEqual('iri');
            expect(ontologyStateSvc.listItem.goTo.active).toEqual(true);
            $timeout.flush();
            expect(ontologyStateSvc.listItem.goTo.entityIRI).toEqual('');
            expect(ontologyStateSvc.listItem.goTo.active).toEqual(false);
        });
        it('hoverIn sets the correct state of hoverEdit', function() {
            expect(this.controller.hoverEdit).toEqual(false);
            this.controller.hoverIn();
            expect(this.controller.hoverEdit).toEqual(true);
        });
        it('hoverIn sets the correct state of hoverEdit and closes the snackbar', function() {
            this.controller.hoverEdit = true;
            expect(this.controller.hoverEdit).toEqual(true);
            this.controller.hoverOut();
            expect(this.controller.hoverEdit).toEqual(false);
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
