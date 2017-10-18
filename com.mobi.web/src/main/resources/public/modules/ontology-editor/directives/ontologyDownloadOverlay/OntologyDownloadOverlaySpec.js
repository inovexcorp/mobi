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
describe('Ontology Download Overlay directive', function() {
    var $compile,
        scope,
        element,
        controller,
        ontologyManagerSvc,
        ontologyStateSvc,
        $q;
    var error = 'error';

    beforeEach(function() {
        module('templates');
        module('ontologyDownloadOverlay');
        injectRegexConstant();
        injectSplitIRIFilter();
        mockOntologyState();
        mockOntologyManager();

        inject(function(_$compile_, _$rootScope_, _ontologyManagerService_, _ontologyStateService_, _$q_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyManagerSvc = _ontologyManagerService_;
            ontologyStateSvc = _ontologyStateService_;
            $q = _$q_;
        });

        element = $compile(angular.element('<ontology-download-overlay></ontology-download-overlay>'))(scope);
        scope.$digest();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('ontology-download-overlay')).toBe(true);
            expect(element.querySelectorAll('.content').length).toBe(1);
        });
        it('with a h6', function() {
            expect(element.find('h6').length).toBe(1);
        });
        it('with a .form-group', function() {
            expect(element.querySelectorAll('.form-group').length).toBe(1);
        });
        it('with a .btn-container', function() {
            expect(element.querySelectorAll('.btn-container').length).toBe(1);
        });
        it('with a .error-display', function() {
            expect(element.querySelectorAll('.error-display').length).toBe(1);
        });
        it('depending on whether the fileName is valid', function() {
            var formGroup = angular.element(element.querySelectorAll('.form-group')[0]);
            expect(formGroup.hasClass('has-error')).toBe(false);

            controller = element.controller('ontologyDownloadOverlay');
            controller.form = {
                fileName: {
                    '$error': {
                        pattern: true
                    }
                }
            }
            scope.$digest();
            expect(formGroup.hasClass('has-error')).toBe(true);
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            controller = element.controller('ontologyDownloadOverlay');
        });
        it('download calls the correct manager function', function() {
            controller.serialization = 'serialization';
            controller.fileName = 'fileName';
            ontologyStateSvc.showDownloadOverlay = true;
            controller.download();
            scope.$apply();
            expect(ontologyManagerSvc.downloadOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId, controller.serialization, controller.fileName);
            expect(ontologyStateSvc.showDownloadOverlay).toBe(false);
        });
    });
});