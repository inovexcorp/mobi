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
         * content for a modal to upload ontologies.
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
         * `uploadOntologyOverlay` is a directive that creates content for a modal that provides a form for entering
         * catalog record metadata about each of the {@link ontologyState.service:ontologyStateService uploaded files}.
         * The form contains a {@link textInput.directive:textInput} for the record title, a
         * {@link textArea.directive:textArea} for the record description, and a
         * {@link keywordSelect.directive:keywordSelect} for each uploaded file. The title defaults to the file name.
         * The modal contains buttons to Cancel, Submit the current ontology upload, and Submit all the subsequent
         * ontology uploads with the default values.
         *
         * @param {Function} close A function that closes the modal
         * @param {Function} dismiss A function that dismisses the modal
         */
        .directive('uploadOntologyOverlay', uploadOntologyOverlay);

        uploadOntologyOverlay.$inject = ['ontologyManagerService', 'ontologyStateService'];

        function uploadOntologyOverlay(ontologyManagerService, ontologyStateService) {
            return {
                restrict: 'E',
                templateUrl: 'modules/ontology-editor/directives/uploadOntologyOverlay/uploadOntologyOverlay.html',
                scope: {
                    close: '&',
                    dismiss: '&'
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    var om = ontologyManagerService;
                    var state = ontologyStateService;
                    var file = undefined;
                    var uploadOffset = state.uploadList.length;
                    dvm.total = state.uploadFiles.length;
                    dvm.index = 0;
                    dvm.title = '';
                    dvm.description = '';
                    dvm.keywords = [];

                    dvm.submit = function() {
                        var id = 'upload-' + (uploadOffset + dvm.index);
                        var promise = om.uploadFile(file, dvm.title, dvm.description, _.map(dvm.keywords, _.trim), id)
                            .then(_.noop, errorMessage => state.addErrorToUploadItem(id, errorMessage));
                        state.uploadList.push({title: dvm.title, id, promise, error: undefined});
                        if ((dvm.index + 1) < dvm.total) {
                            dvm.index++;
                            setFormValues();
                        } else {
                            state.uploadFiles.splice(0);
                            $scope.close();
                        }
                    }
                    dvm.submitAll = function() {
                        for (var i = dvm.index; i < dvm.total; i++) {
                            dvm.submit();
                        }
                    }
                    dvm.cancel = function() {
                        state.uploadFiles.splice(0);
                        dvm.total = 0;
                        $scope.dismiss();
                    }

                    function setFormValues() {
                        file = _.pullAt(state.uploadFiles, 0)[0];
                        dvm.title = file.name;
                        dvm.description = '';
                        dvm.keywords = [];
                    }

                    if (dvm.total) {
                        setFormValues();
                    }
                    if (dvm.total < 1) {
                        dvm.cancel();
                    }
                }]
            };
        }
})();
