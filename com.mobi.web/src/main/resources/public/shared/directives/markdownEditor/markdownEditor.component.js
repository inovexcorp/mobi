/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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
     * @name markdownEditor.component:markdownEditor
     *
     * @description
     * `markdownEditor` is a component which creates a Bootstrap `.form-group` containing a textarea with a header
     * along with two buttons. One button has a configurable click action to "submit" the text and the other has a
     * configurable click action to "cancel" the text. The header contains a button for toggling a preview of the
     * contents of the textarea displayed as rendered Markdown. The header also contains a link to documentation on
     * Markdown.
     *
     * @param {*} bindModel The variable to bind the value of the text area to
     * @param {string} placeHolder A placeholder string for the text area
     * @param {boolean} isFocusMe Whether or not the text area should be focused
     * @param {string} buttonText The text for the button for submitting the markdown
     * @param {Function} clickEvent A function to call when the "submit" button is clicked
     * @param {Function} cancelEvent A function to call when the "cancel" button is clicked
     */
    const markdownEditorComponent = {
        templateUrl: 'shared/directives/markdownEditor/markdownEditor.component.html',
        bindings: {
            bindModel: '=ngModel',
            placeHolder: '<',
            isFocusMe: '<?',
            buttonText: '<',
            allowBlankValue: '<',
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

    angular
        /**
         * @ngdoc overview
         * @name markdownEditor
         *
         * @description
         * The `markdownEditor` module only provides the `markdownEditor` component which creates a Bootstrap
         * `.form-group` with a textarea for writing Markdown and a button to submit it.
         */
        .module('markdownEditor', [])
        .component('markdownEditor', markdownEditorComponent);
})();
