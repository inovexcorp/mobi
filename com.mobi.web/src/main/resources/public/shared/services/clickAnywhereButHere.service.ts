import { find } from 'lodash';

clickAnywhereButHereService.$inject = ['$document'];

/**
 * @ngdoc service
 * @name shared.service:clickAnywhereButHereService
 * @requires $document
 *
 * @description
 * `clickAnywhereButHereService` is a service that attaches a click handler to the document that
 * will call the passed expression for the passed scope if there isn't already a handler attached
 * for that scope. When the scope is destroyed that click handler will be removed.
 *
 * @param {Function} $scope The scope to call the passed expression within
 * @param {*} expr The expression to evaluate when the document is clicked
 */
function clickAnywhereButHereService($document) {
    var tracker = [];

    return function($scope, expr) {
        var t = find(tracker, tr => tr.expr === expr && tr.scope === $scope);
        if (t) {
            return t;
        }
        var handler = function() {
            $scope.$apply(expr);
        };
        $document.on('click', handler);

        // IMPORTANT! Tear down this event handler when the scope is destroyed.
        $scope.$on('$destroy', function() {
            $document.off('click', handler);
        });

        t = { scope: $scope, expr };
        tracker.push(t);
        return t;
    };
}

export default clickAnywhereButHereService;