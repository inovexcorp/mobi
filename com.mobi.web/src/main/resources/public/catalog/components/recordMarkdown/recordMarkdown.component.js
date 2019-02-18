
(function () {
    'use strict';

    /**
     * @ngdoc component
     * @name catalog.component:recordMarkdown
     * @requires utilService.service:utilService
     *
     * @description
     * `recordMarkdown` is a component which creates a display for the `dcterms:abstract` of the provided catalog Record
     * as markdown HTML. If the user can edit the record, as determined by the provided `canEdit` boolean, the display
     * will turn into a {@link markdownEditor.component:markdownEditor}. Saving the edited markdown will call the
     * provided `updateRecord` method passing the edited Record JSON-LD.
     * 
     * @param {Object} record A JSON-LD object for a catalog Record
     * @param {boolean} canEdit Whether the Record can be edited by the current user
     * @param {Function} updateRecord A method to update the Record. Expects a parameter called `record` and that the
     * method will return a Promise.
     */
    const recordMarkdownComponent = {
        templateUrl: 'catalog/components/recordMarkdown/recordMarkdown.component.html',
        bindings: {
            record: '<',
            canEdit: '<',
            updateRecord: '&'
        },
        controllerAs: 'dvm',
        controller: recordMarkdownComponentCtrl
    };

    recordMarkdownComponentCtrl.$inject = ['$q', 'utilService', 'showdown'];

    function recordMarkdownComponentCtrl($q, utilService, showdown) {
        var dvm = this;
        var util = utilService;
        dvm.converter = new showdown.Converter();
        dvm.converter.setFlavor('github');
        dvm.markdownHTML = '';
        dvm.edit = false;
        dvm.editMarkdown = ''
        
        dvm.$onInit = function() {
            if (dvm.record && !_.isEmpty(dvm.record)) {
                dvm.markdownHTML = dvm.converter.makeHtml(util.getDctermsValue(dvm.record, 'abstract'));
            }
        }
        dvm.$onChanges = function() {
            if (dvm.record && !_.isEmpty(dvm.record)) {
                dvm.markdownHTML = dvm.converter.makeHtml(util.getDctermsValue(dvm.record, 'abstract'));                
            }
        }
        dvm.showEdit = function() {
            if (dvm.canEdit) {
                dvm.edit = true;
                dvm.editMarkdown = util.getDctermsValue(dvm.record, 'abstract');
            }
        }
        dvm.saveEdit = function() {
            this.originalValue = util.getDctermsValue(dvm.record, 'abstract');
            if (this.originalValue === this.editMarkdown) {
                dvm.edit = false;
                dvm.editMarkdown = '';
            } else {
                if (!dvm.editMarkdown) {
                    util.removeDctermsValue(dvm.record, 'abstract', this.originalValue);
                } else {
                    util.updateDctermsValue(dvm.record, 'abstract', this.editMarkdown);
                }
                $q.when()
                    .then(() => dvm.updateRecord({record: dvm.record}))
                    .then(() => {
                        dvm.edit = false;
                        dvm.editMarkdown = '';
                    }, () => {
                        util.updateDctermsValue(dvm.record, 'abstract', this.originalValue);
                    });
            }
        }
        dvm.cancelEdit = function() {
            dvm.edit = false;
            dvm.editMarkdown = '';
        }
    }

    angular.module('catalog')
        .component('recordMarkdown', recordMarkdownComponent);
})();