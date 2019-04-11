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
describe('Ontology Download Overlay component', function() {
    var $compile, scope, ontologyManagerSvc, ontologyStateSvc;

    beforeEach(function() {
        module('templates');
        module('ontology-editor');
        mockComponent('serializationSelect', 'serializationSelect');
        injectRegexConstant();
        injectSplitIRIFilter();
        mockOntologyState();
        mockOntologyManager();

        inject(function(_$compile_, _$rootScope_, _ontologyManagerService_, _ontologyStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyManagerSvc = _ontologyManagerService_;
            ontologyStateSvc = _ontologyStateService_;
        });

        this.error = 'error';

        scope.close = jasmine.createSpy('close');
        scope.dismiss = jasmine.createSpy('dismiss');
        this.element = $compile(angular.element('<ontology-download-overlay close="close()" dismiss="dismiss()"></ontology-download-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('ontologyDownloadOverlay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyManagerSvc = null;
        ontologyStateSvc = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('ONTOLOGY-DOWNLOAD-OVERLAY');
            expect(this.element.querySelectorAll('.modal-header').length).toBe(1);
            expect(this.element.querySelectorAll('.modal-body').length).toBe(1);
            expect(this.element.querySelectorAll('.modal-footer').length).toBe(1);
        });
        it('with a h3', function() {
            expect(this.element.find('h3').length).toBe(1);
        });
        it('with a .form-group', function() {
            expect(this.element.querySelectorAll('.form-group').length).toBe(1);
        });
        it('with a .invalid-feedback', function() {
            expect(this.element.querySelectorAll('.invalid-feedback').length).toBe(1);
        });
        it('depending on whether the fileName is valid', function() {
            var nameInput = angular.element(this.element.querySelectorAll('.form-group input')[0]);
            expect(nameInput.hasClass('is-invalid')).toBe(false);

            this.controller.form = {
                fileName: {
                    '$error': {
                        pattern: true
                    }
                }
            }
            scope.$digest();
            expect(nameInput.hasClass('is-invalid')).toBe(true);
        });
        it('with buttons to submit and cancel', function() {
            var buttons = this.element.querySelectorAll('.modal-footer button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Submit'].indexOf(angular.element(buttons[0]).text()) >= 0).toBe(true);
            expect(['Cancel', 'Submit'].indexOf(angular.element(buttons[1]).text()) >= 0).toBe(true);
        });
    });
    describe('controller methods', function() {
        it('download calls the correct manager function', function() {
            this.controller.serialization = 'serialization';
            this.controller.fileName = 'fileName';
            this.controller.download();
            scope.$apply();
            expect(ontologyManagerSvc.downloadOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId, this.controller.serialization, this.controller.fileName);
            expect(scope.close).toHaveBeenCalled();
        });
        it('should cancel the overlay', function() {
            this.controller.cancel();
            expect(scope.dismiss).toHaveBeenCalled();
        });
    });
});