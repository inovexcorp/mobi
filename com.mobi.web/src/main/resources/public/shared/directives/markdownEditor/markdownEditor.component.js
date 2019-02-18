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
