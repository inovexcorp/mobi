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
(function() {
    'use strict';

    /**
     * @ngdoc component
     * @name shared.component:fileInput
     * 
     * @description
     * `fileInput` is a component that creates a button that will trigger a hidden file input when clicked that uses the
     * {@link shared.directive:fileChange} directive to retrieve the selected file objects. The input can be configured
     * to accept either one or multiple files and will update the `bindModel` appropriately, but only one way. The
     * provided `changeEvent` function is expected to update the value of `bindModel`. The file names of all the
     * selected files will be displayed to the right of the "Choose File" button. The input can optionally be configured
     * when a list of file extensions to accept, a name for the input field for use in form validation, and whether the
     * input should be required.
     * 
     * @param {*} bindModel The variable to bind the selected file(s) to
     * @param {Function} changeEvent A function to be called when the selected file(s) change. Should update the value
     * of `bindModel`. Expects an argument called `value`.
     * @param {string} [displayText=''] Optional text for a label for the input
     * @param {string} [helpText=''] Optional help text for below the file input
     * @param {string} [accept=''] Optional string of comma separated extensions to limit the file input to
     * @param {string} [inputName=''] Optional name of the file input. Used for form validation errors
     * @param {boolean} [multiple=false] Whether the file input should accept multiple files
     * @param {boolean} [required=false] Whether the file input should be required
     */
    const fileInputComponent = {
        templateUrl: 'shared/components/fileInput/fileInput.component.html',
        bindings: {
            bindModel: '<',
            changeEvent: '&',
            displayText: '<?',
            helpText: '<?',
            accept: '<?',
            inputName: '<?',
            multiple: '@',
            required: '@'
        },
        controllerAs: 'dvm',
        controller: fileInputComponentCtrl
    };

    fileInputComponentCtrl.$inject = ['$scope'];

    function fileInputComponentCtrl($scope) {
        var dvm = this;
        dvm.selected = false;
        dvm.text = '';
        dvm.id = '';

        dvm.$onInit = function() {
            dvm.id = 'file_input_' + $scope.$id;
            dvm.isMultiple = dvm.multiple !== undefined;
            dvm.isRequired = dvm.required !== undefined;
            if ((_.isArray(dvm.bindModel) && dvm.bindModel.length) || dvm.bindModel) {
                dvm.selected = true;
                dvm.text = _.isArray(dvm.bindModel) ? collectFileNames(dvm.bindModel) : dvm.bindModel.name;
            } else {
                resetText();
            }
        }
        dvm.click = function() {
            document.getElementById(dvm.id).click();
        }
        dvm.update = function(event, files) {
            if (files.length) {
                if (dvm.multiple) {
                    dvm.selected = true;
                    dvm.text = collectFileNames(files);
                    dvm.changeEvent({value: files});
                } else {
                    dvm.selected = true;
                    dvm.text = files[0].name;
                    dvm.changeEvent({value: files[0]});
                }
            } else {
                dvm.selected = false;
                resetText();
                dvm.changeEvent({value: dvm.multiple ? [] : undefined});
            }
        }

        function collectFileNames(files) {
            return _.join(_.map(files, 'name'), ', ');
        }
        function resetText() {
            dvm.text = dvm.multiple ? 'No files selected' : 'No file selected';
        }
    }

    angular.module('shared')
        .component('fileInput', fileInputComponent);
})();