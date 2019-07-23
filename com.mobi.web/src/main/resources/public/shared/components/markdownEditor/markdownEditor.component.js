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
     * @name shared.component:markdownEditor
     *
     * @description
     * `markdownEditor` is a component which creates a Bootstrap `.form-group` containing a textarea with a header
     * along with two buttons. One button has a configurable click action to "submit" the text and the other has a
     * configurable click action to "cancel" the text. The header contains a button for toggling a preview of the
     * contents of the textarea displayed as rendered Markdown. The header also contains a link to documentation on
     * Markdown. The value of the textarea is bound to `bindModel`, but only one way. The provided `changeEvent`
     * function is expected to update the value of `bindModel`.
     *
     * @param {*} bindModel The variable to bind the value of the text area to
     * @param {Function} changeEvent A function to be called when the value of the textarea changes. Expects an argument
     * called `value` and should update the value of `bindModel`.
     * @param {string} placeHolder A placeholder string for the text area
     * @param {boolean} [isFocusMe=false] An optional boolean for whether the text area should be focused on render
     * @param {string} buttonText The text for the button for submitting the markdown
     * @param {boolean} allowBlankValue Whether the input should allow a blank value to be "submitted"
     * @param {string} startRows An optional value for the "rows" attribute on the `textarea`
     * @param {Function} clickEvent A function to call when the "submit" button is clicked
     * @param {Function} cancelEvent A function to call when the "cancel" button is clicked
     */
    const markdownEditorComponent = {
        templateUrl: 'shared/components/markdownEditor/markdownEditor.component.html',
        bindings: {
            bindModel: '<',
            changeEvent: '&',
            placeHolder: '<',
            isFocusMe: '<?',
            buttonText: '<',
            allowBlankValue: '<',
            startRows: '<?',
            clickEvent: '&',
            cancelEvent: '&?'
        },
        controllerAs: 'dvm',
        controller: markdownEditorComponentCtrl,
    }

    markdownEditorComponentCtrl.$inject = ['$sce', 'showdown'];

    function markdownEditorComponentCtrl($sce, showdown) {
        var dvm = this;
        dvm.converter = new showdown.Converter();
        dvm.converter.setFlavor('github');

        dvm.showPreview = false;
        dvm.preview = '';
        dvm.markdownTooltip = $sce.trustAsHtml('For information about markdown syntax, see <a href="https://guides.github.com/features/mastering-markdown/" target="_blank">here</a>');

        dvm.click = function() {
            dvm.clickEvent();
            dvm.preview = '';
            dvm.showPreview = false;
        }
        dvm.cancel = function() {
            dvm.cancelEvent();
            dvm.preview = '';
            dvm.showPreview = false;
        }
        dvm.isDisabled = function() {
            return dvm.allowBlankValue ? false : !dvm.bindModel;
        }
        dvm.togglePreview = function() {
            if (dvm.showPreview) {
                dvm.preview = '';
                dvm.showPreview = false;
            } else {
                dvm.preview = dvm.converter.makeHtml(dvm.bindModel);
                dvm.showPreview = true;
            }
        }
    }

    angular.module('shared')
        .component('markdownEditor', markdownEditorComponent);
})();
