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
describe('Upload Ontology Tab directive', function() {
    var $compile, scope, $q, ontologyStateSvc;

    beforeEach(function() {
        module('templates');
        module('uploadOntologyTab');
        mockOntologyState();

        inject(function(_$compile_, _$rootScope_, _$q_, _ontologyStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            ontologyStateSvc = _ontologyStateService_;
        });

        this.element = $compile(angular.element('<upload-ontology-tab></upload-ontology-tab>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('uploadOntologyTab');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        ontologyStateSvc = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('upload-ontology-tab')).toBe(true);
            expect(this.element.querySelectorAll('.actions').length).toBe(1);
            expect(this.element.querySelectorAll('.form-container').length).toBe(1);
        });
        _.forEach(['actions', 'header', 'form-container', 'col-xs-6'], function(item) {
            it('with a .' + item, function() {
                expect(this.element.querySelectorAll('.' + item).length).toBe(1);
            });
        });
        _.forEach(['block', 'block-content', 'form', 'drag-file'], function(tag) {
            it('with a ' + tag, function() {
                expect(this.element.find(tag).length).toBe(1);
            });
        });
        it('with a upload-ontology-overlay', function() {
            expect(this.element.find('upload-ontology-overlay').length).toBe(0);
            this.controller.showOverlay = true;
            scope.$apply();
            expect(this.element.find('upload-ontology-overlay').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        describe('hasStatus should return the correct boolean when value and status are', function() {
            beforeEach(function() {
                this.promise = {
                    '$$state': {
                        status: 0
                    }
                };
            });
            it('equal', function() {
                expect(this.controller.hasStatus(this.promise, 0)).toBe(true);
            });
            it('not equal', function() {
                expect(this.controller.hasStatus(this.promise, 1)).toBe(false);
            });
        });
        it('cancel should set and call correct things', function() {
            this.controller.cancel();
            expect(ontologyStateSvc.showUploadTab).toBe(false);
            expect(ontologyStateSvc.clearUploadList).toHaveBeenCalled();
        })
    });
});
