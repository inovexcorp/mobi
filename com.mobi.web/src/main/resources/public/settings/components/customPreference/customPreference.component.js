(function() {
    'use strict';
    /**
     * @ngdoc component
     * @name settings.component:customPreference
     *
     * @description
     * `customPreference` is a component that creates an article with transcluded content, a header, and a question
     * representing what the setting is for. The main content for the overlay is transcluded so it can contain whatever is
     * put between the opening and closing tags.
     *
     * @param {string} header the text to display in the article's header
     * @param {string} question the text to display as the setting's representative question
     */
    const customPreferenceComponent = {
        templateUrl: 'settings/components/customPreference/customPreference.component.html',
        transclude: true,
        bindings: {
            header: '<',
            question: '<'
        },
        controllerAs: 'dvm',
        controller: customPreferenceComponentCtrl
    }

    function customPreferenceComponentCtrl() {
        var dvm = this;
    }

    angular.module('settings')
        .component('customPreference', customPreferenceComponent);
})();