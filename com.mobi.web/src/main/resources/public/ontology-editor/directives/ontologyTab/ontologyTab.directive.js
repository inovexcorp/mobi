(function() {
    'use strict';

    angular
        .module('ontologyTab', [])
        /**
         * @ngdoc directive
         * @name ontologyTab.directive:ontologyTab
         * @scope
         * @restrict E
         * @requires ontologyState.service:ontologyStateService
         * @requires catalogManager.service:catalogManagerService
         * @requires util.service:utilService
         * @requires prefixes.service:prefixes
         *
         * @description
         * `ontologyTab` is a directive that creates a `div` containing all the directives necessary for
         * displaying an ontology. This includes a {@link mergeTab.directive:mergeTab},
         * {@link ontologyButtonStack.directive:ontologyButtonStack}, and
         * {@link materialTabset.directive:materialTabset}. The `materialTabset` contains tabs for the
         * {@link projectTab.directive:projectTab}, {@link overviewTab.directive:overviewTab},
         * {@link classesTab.directive:classesTab}, {@link propertiesTab.directive:propertiesTab},
         * {@link individualsTab.directive:individualsTab}, {@link conceptSchemesTab.directive:conceptSchemesTab},
         * {@link conceptsTab.directive:conceptsTab}, {@link searchTab.directive:searchTab},
         * {@link savedChangesTab.directive:savedChangesTab}, and {@link commitsTab.directive:commitsTab}. The
         * directive is replaced by the contents of its template.
         */
        .directive('ontologyTab', ontologyTab);

        ontologyTab.$inject = ['$q', 'ontologyStateService', 'catalogManagerService', 'utilService', 'prefixes'];

        function ontologyTab($q, ontologyStateService, catalogManagerService, utilService, prefixes) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'ontology-editor/directives/ontologyTab/ontologyTab.directive.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var cm = catalogManagerService;
                    var util = utilService;

                    dvm.os = ontologyStateService;
                    dvm.savedChanges = '<i class="fa fa-exclamation-triangle"></i> Changes';

                    function checkBranchExists() {
                        if (dvm.os.listItem.ontologyRecord.branchId && !_.find(dvm.os.listItem.branches, {'@id': dvm.os.listItem.ontologyRecord.branchId})) {
                            var catalogId = _.get(cm.localCatalog, '@id', '');
                            var masterBranch = _.find(dvm.os.listItem.branches, branch => util.getDctermsValue(branch, 'title') === 'MASTER')['@id'];
                            var state = dvm.os.getOntologyStateByRecordId(dvm.os.listItem.ontologyRecord.recordId);
                            var commitId = util.getPropertyId(_.find(state.model, {[prefixes.ontologyState + 'branch']: [{'@id': masterBranch}]}), prefixes.ontologyState + 'commit');
                            cm.getBranchHeadCommit(masterBranch, dvm.os.listItem.ontologyRecord.recordId, catalogId)
                                .then(headCommit => {
                                    var headCommitId = _.get(headCommit, "commit['@id']", '');
                                    if (!commitId) {
                                        commitId = headCommitId;
                                    }
                                    return dvm.os.updateOntology(dvm.os.listItem.ontologyRecord.recordId, masterBranch, commitId, commitId === headCommitId);
                                }, $q.reject)
                                .then(() => dvm.os.resetStateTabs(), util.createErrorToast);
                        }
                    }

                    checkBranchExists();
                }
            }
        }
})();
