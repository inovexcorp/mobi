(function() {
    'use strict';
    /**
     * @ngdoc component
     * @name settings.component:preferencesContainer
     *
     * @description
     * `preferencesContainer` is a component that creates a section with transcluded content and a header. The main content
     * for the container is transcluded so it can contain whatever is put between the opening and closing tags. However, it
     * is expected that the content will be {@link settings.component:customPreference customPreference} components.
     *
     * @param {string} header the text to display in the section's header
     */
    const preferencesContainerComponent = {
        templateUrl: 'settings/components/preferencesContainer/preferencesContainer.component.html',
        transclude: true,
        bindings: {
            header: '<'
        },
        controllerAs: 'dvm',
        controller: preferencesContainerComponentCtrl
    };

    function preferencesContainerComponentCtrl() {
        var dvm = this;
    }

    angular.module('settings')
        .component('preferencesContainer', preferencesContainerComponent);
})();