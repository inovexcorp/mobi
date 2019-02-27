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
     * @name shared.component:inlineEdit
     * @requires shared.service:utilService
     *
     * @description
     * `inlineEdit` is a component which creates TODO
     *
     * @param {*} bindModel The variable to bind the value of the text area to
     * @param {Function} saveEvent A function to call when the "save" button is clicked
     */
    const inlineEditComponent = {
        templateUrl: 'shared/components/inlineEdit/inlineEdit.component.html',
        transclude: true,
        bindings: {
            text: '<',
            canEdit: '<',
            area: '<',
            required: '<',
            placeholder: '<',
            saveEvent: '&'
        },
        controllerAs: 'dvm',
        controller: inlineEditComponentCtrl,
    }

    inlineEditComponentCtrl.$inject = ['utilService'];

    function inlineEditComponentCtrl(utilService) {
        var dvm = this;
        dvm.edit = false;
        var util = utilService;

        dvm.$onInit = function() {
            dvm.initialText = dvm.text;
        }
        dvm.$onChanges = function() {
            dvm.initialText = dvm.text;
        }
        dvm.saveChanges = function() {
            dvm.edit = false;
            if (dvm.required && dvm.text === '') {
                dvm.onBlur();
                util.createWarningToast('Text input must not be empty')
            } else {
                dvm.saveEvent({text: dvm.text});
            }
        }
        dvm.onBlur = function() {
            dvm.text = dvm.initialText;
            dvm.edit = false;
        }
        dvm.onKeyUp = function(event) {
            if (event.keyCode === 13 && !event.shiftKey) {
                dvm.saveChanges();
            }
        }
    }

    angular
        .module('shared')
        .component('inlineEdit', inlineEditComponent);
})();
