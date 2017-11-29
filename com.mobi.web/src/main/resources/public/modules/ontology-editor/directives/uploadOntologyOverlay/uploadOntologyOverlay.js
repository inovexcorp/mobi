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
(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name uploadOntologyOverlay
         *
         * @description
         * The `uploadOntologyOverlay` module only provides the `uploadOntologyOverlay` directive which creates
         * upload ontology overlay.
         */
        .module('uploadOntologyOverlay', [])
        /**
         * @ngdoc directive
         * @name uploadOntologyOverlay.directive:uploadOntologyOverlay
         * @scope
         * @restrict E
         * @requires ontologyManager.service:ontologyManagerService
         * @requires ontologyState.service:ontologyStateService
         *
         * @description
         * HTML contents in the upload ontology overlay which provides an overlay to enter catalog record metadata
         * about each of the uploaded files.
         *
         * @param {Function} closeOverlay the function to call to close the overlay
         * @param {Object[]} files the list of files to the need catalog metadata added
         */
        .directive('uploadOntologyOverlay', uploadOntologyOverlay);

        uploadOntologyOverlay.$inject = ['ontologyManagerService', 'ontologyStateService'];

        function uploadOntologyOverlay(ontologyManagerService, ontologyStateService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/uploadOntologyOverlay/uploadOntologyOverlay.html',
                scope: {},
                bindToController: {
                    closeOverlay: '&',
                    files: '='
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var om = ontologyManagerService;
                    var state = ontologyStateService;
                    var file = undefined;
                    dvm.total = dvm.files.length;
                    dvm.index = 0;
                    dvm.title = '';
                    dvm.description = '';
                    dvm.keywords = [];

                    dvm.submit = function() {
                        var id = 'upload-' + dvm.index;
                        var promise = om.uploadFile(file, dvm.title, dvm.description, _.join(_.map(dvm.keywords, _.trim), ','), id)
                            .then(_.noop, errorMessage => state.addErrorToUploadItem(id, errorMessage));
                        state.uploadList.push({title: dvm.title, id, promise, error: undefined});
                        if ((dvm.index + 1) < dvm.total) {
                            dvm.index++;
                            setFormValues();
                        } else {
                            dvm.closeOverlay();
                        }
                    }

                    dvm.submitAll = function() {
                        for (var i = dvm.index; i < dvm.total; i++) {
                            dvm.submit();
                        }
                    }

                    dvm.cancel = function() {
                        dvm.files.splice(0);
                        dvm.closeOverlay();
                    }

                    function setFormValues() {
                        file = _.pullAt(dvm.files, 0)[0];
                        dvm.title = file.name;
                        dvm.description = '';
                        dvm.keywords = [];
                    }

                    if (dvm.total) {
                        setFormValues();
                    }
                }
            };
        }
})();
