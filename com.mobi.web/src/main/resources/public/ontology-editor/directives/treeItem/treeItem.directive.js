(function() {
    'use strict';

    angular
        .module('treeItem', [])
        .directive('treeItem', treeItem);

        treeItem.$inject = ['settingsManagerService', 'ontologyStateService'];

        function treeItem(settingsManagerService, ontologyStateService) {
            return {
                restrict: 'E',
                replace: true,
                scope: {},
                bindToController: {
                    hasChildren: '<',
                    isActive: '<',
                    isBold: '<',
                    onClick: '&',
                    currentEntity: '<',
                    isOpened: '<',
                    path: '<',
                    underline: '<'
                },
                templateUrl: 'ontology-editor/directives/treeItem/treeItem.directive.html',
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    var treeDisplay = settingsManagerService.getTreeDisplay();
                    var os = ontologyStateService;

                    dvm.getTreeDisplay = function() {
                        if (treeDisplay === 'pretty') {
                            return os.getEntityNameByIndex(_.get(dvm.currentEntity, '@id'), os.listItem);
                        }
                        return _.get(dvm.currentEntity, 'mobi.anonymous', '');
                    }
                    dvm.toggleOpen = function() {
                        dvm.isOpened = !dvm.isOpened;
                        os.setOpened(_.join(dvm.path, '.'), dvm.isOpened);
                    }
                    dvm.isSaved = function() {
                        var ids = _.unionWith(_.map(os.listItem.inProgressCommit.additions, '@id'), _.map(os.listItem.inProgressCommit.deletions, '@id'), _.isEqual);
                        return _.includes(ids, _.get(dvm.currentEntity, '@id'));
                    }

                    dvm.saved = dvm.isSaved();

                    $scope.$watch(() => os.listItem.inProgressCommit.additions + os.listItem.inProgressCommit.deletions, () => dvm.saved = dvm.isSaved());
                }]
            }
        }
})();
