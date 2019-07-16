import * as _ from 'lodash';

beforeUnload.$inject = ['$window', '$rootScope', 'ontologyStateService', 'mapperStateService'];

function beforeUnload($window, $rootScope, ontologyStateService, mapperStateService) {
    $window.onbeforeunload = function(e) {
        if ($rootScope.isDownloading) {
            $rootScope.isDownloading = false;
            return undefined;
        } else {
            var ontologyHasChanges = _.some(ontologyStateService.list, ontologyStateService.hasChanges);
            var mappingHasChanges = mapperStateService.isMappingChanged();
            if (ontologyHasChanges || mappingHasChanges) {
                return true;
            }
        }
    }
}

export default beforeUnload;