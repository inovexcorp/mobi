/*-
 * #%L
 * org.matonto.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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

    angular
        /**
         * @ngdoc overview
         * @name commitHistoryTable
         *
         * @description
         * The `commitHistoryTable` module only provides the `commitHistoryTable` directive which creates
         * a table and optionally a graph of the head commit of a branch.
         */
        .module('commitHistoryTable', [])
        /**
         * @ngdoc directive
         * @name commitHistoryTable.directive:commitHistoryTable
         * @scope
         * @restrict E
         * @requires catalogManager.service:catalogManagerService
         * @requires util.service:utilService
         * @requires userManager.service:userManagerService
         *
         * @description
         * `commitHistoryTable` is a directive that creates a table containing the commit chain of the head commit of
         * the branch identified by the passed record id amd branch JSON-LD object. Can optionally also display a SVG
         * graph generated using Snap.svg showing the network the commits. Clicking on a commit id or its corresponding
         * circle in the graph will open up a {@link commitInfoOverlay.directive:commitInfoOverlay commit info overlay}.
         * The directive is replaced by the content of the template.
         *
         * @param {string} recordId The IRI string of a record in the local catalog
         * @param {string} branch The JSON-LD object of a branch
         * @param {string=''} commitId The IRI string of the head commit of the Branch to be used when determining whether
         * the table should be updated.
         */
        .directive('commitHistoryTable', commitHistoryTable);

        commitHistoryTable.$inject = ['catalogManagerService', 'utilService', 'userManagerService', 'Snap', 'chroma'];

        function commitHistoryTable(catalogManagerService, utilService, userManagerService, Snap, chroma) {
            return {
                restrict: 'E',
                replace: true,
                transclude: true,
                scope: {},
                bindToController: {
                    recordId: '<',
                    branch: '<',
                    commitId: '<?'
                },
                templateUrl: 'directives/commitHistoryTable/commitHistoryTable.html',
                link: function(scope, el, attrs, ctrl) {
                    scope.graph = attrs.hasOwnProperty('graph');
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    var titleWidth = 75;
                    var cm = catalogManagerService;
                    var catalogId = _.get(cm.localCatalog, '@id', '');
                    var snap = Snap('.commit-graph');
                    var graphCommits = [];
                    var cols = [];
                    var wrapper;
                    var xI = 1;
                    var colors = chroma.brewer.Set1;
                    var colorIdx = 0;

                    dvm.util = utilService;
                    dvm.um = userManagerService;
                    dvm.showOverlay = false;
                    dvm.error = '';
                    dvm.commit = undefined;
                    dvm.additions = [];
                    dvm.deletions = [];
                    dvm.commits = [];
                    dvm.circleRadius = 5;
                    dvm.circleSpacing = 50;
                    dvm.columnSpacing = 25;
                    dvm.deltaX = 5 + dvm.circleRadius;
                    dvm.deltaY = 37;

                    $scope.$watchGroup(['dvm.branch', 'dvm.recordId', 'dvm.commitId'], newValues => dvm.getCommits());

                    dvm.openCommitOverlay = function(commitId) {
                        cm.getBranchCommit(commitId, dvm.branch['@id'], dvm.recordId, catalogId)
                            .then(commit => {
                                dvm.commit = _.find(dvm.commits, {id: commitId});
                                dvm.additions = commit.additions;
                                dvm.deletions = commit.deletions;
                                dvm.showOverlay = true;
                            }, errorMessage => dvm.error = errorMessage);
                    }
                    dvm.getCommits = function() {
                        cm.getBranchCommits(dvm.branch['@id'], dvm.recordId, catalogId)
                            .then(commits => {
                                dvm.commits = commits;
                                dvm.error = '';
                                if ($scope.graph) {
                                    dvm.drawGraph();
                                }
                            }, errorMessage => {
                                dvm.error = errorMessage;
                                dvm.commits = [];
                                if ($scope.graph) {
                                    dvm.reset();
                                }
                            });
                    }
                    dvm.drawGraph = function() {
                        dvm.reset();
                        if (dvm.commits.length > 0) {
                            wrapper = snap.group();
                            // First draw circles in a straight line
                            _.forEach(dvm.commits, (commit, i) => {
                                var circle = snap.circle(0, dvm.circleSpacing/2 + (i * dvm.circleSpacing), dvm.circleRadius);
                                var title = Snap.parse('<title>' + dvm.util.condenseCommitId(commit.id) + '</title>')
                                circle.append(title);
                                circle.attr({id: commit.id});
                                circle.click(() => dvm.openCommitOverlay(commit.id));
                                wrapper.add(circle);
                                graphCommits.push({commit: commit, circle: circle});
                            });
                            // Set up head commit and begin recursion
                            var c = graphCommits[0];
                            var color = colors[colorIdx % colors.length];
                            colorIdx++;
                            c.circle.attr({fill: color});
                            cols.push({x: 0, commits: [c.commit.id], color: color});
                            drawBranchTitle(c.circle);
                            recurse(c);
                            // Update deltaX based on how many columns there are or the minimum width
                            dvm.deltaX = _.max([dvm.deltaX + xI * dvm.columnSpacing, titleWidth + 10 + dvm.circleRadius]);
                            // Shift the x and y coordinates of everything using deltaX and deltaY
                            _.forEach(graphCommits, (c, idx) => c.circle.attr({cx: c.circle.asPX('cx') + dvm.deltaX, cy: c.circle.asPX('cy') + dvm.deltaY}));
                            _.forEach(wrapper.selectAll('path'), path => {
                                var points = _.map(_.split(path.attr('d'), ' '), s => {
                                    var sections;
                                    var head;
                                    if (_.startsWith(s, 'M') || _.startsWith(s, 'C') || _.startsWith(s, 'L')) {
                                        head = _.head(s);
                                        sections = _.split(s.substring(1), ',');
                                    } else {
                                        head = '';
                                        sections = _.split(s, ',');
                                    }
                                    sections[0] = '' + (parseFloat(sections[0], 10) + dvm.deltaX);
                                    sections[1] = '' + (parseFloat(sections[1], 10) + dvm.deltaY);
                                    return head + _.join(sections, ',');
                                });
                                path.attr({d: _.join(points, ' ')});
                            });
                            _.forEach(wrapper.selectAll('rect'), rect => rect.attr({x: rect.asPX('x') + dvm.deltaX, y: rect.asPX('y') + dvm.deltaY}));
                            _.forEach(wrapper.selectAll('text'), text => text.attr({x: text.asPX('x') + dvm.deltaX, y: text.asPX('y') + dvm.deltaY}));
                        }
                    }
                    dvm.reset = function() {
                        graphCommits = [];
                        cols = [];
                        xI = 1;
                        colorIdx = 0;
                        wrapper = undefined;
                        snap.clear();
                        dvm.deltaX = 5 + dvm.circleRadius;
                    }

                    function recurse(c) {
                        // Find the column this commit belongs to and the ids of its base and auxiliary commits
                        var col = _.find(cols, col => _.includes(col.commits, c.commit.id));
                        var baseParent = c.commit.base;
                        var auxParent = c.commit.auxiliary;
                        // If there is an auxiliary parent, there is also a base parent
                        if (auxParent) {
                            // Shift the base parent to be beneath and draw a line between them
                            var baseC = _.find(graphCommits, {commit: {id: baseParent}});
                            baseC.circle.attr({cx: col.x, fill: col.color});
                            col.commits.push(baseC.commit.id);
                            drawLine(c.circle, baseC.circle, col.color);
                            // Determine whether auxiliary parent is already in a column
                            var auxC = _.find(graphCommits, {commit: {id: auxParent}});
                            var auxCol = _.find(cols, col => _.includes(col.commits, auxParent));
                            var color;
                            if (auxCol) {
                                // If in a column, collect line color
                                color = auxCol.color;
                            } else {
                                // If not in a column, shift the auxiliary parent to the left in new column and collect line color
                                color = colors[colorIdx % colors.length];
                                colorIdx++;
                                auxC.circle.attr({cx: -dvm.columnSpacing * xI, fill: color});
                                cols.push({x: -dvm.columnSpacing * xI, commits: [auxParent], color: color});
                                xI++;
                            }
                            // Draw a line commit and auxiliary commit
                            drawLine(c.circle, auxC.circle, color);
                            // Recurse on right first
                            recurse(baseC);
                            // Recurse on left only if it wasn't in a column to begin with
                            if (!auxCol) {
                                recurse(auxC);
                            }
                        } else if (baseParent) {
                            // Determine whether the base parent is already in a column
                            var baseC = _.find(graphCommits, {commit: {id: baseParent}});
                            var baseCol = _.find(cols, col => _.includes(col.commits, baseParent));
                            if (!baseCol) {
                                // If not in a column, push into current column and draw a line between them
                                baseC.circle.attr({cx: col.x, fill: col.color});
                                col.commits.push(baseParent);
                                drawLine(c.circle, baseC.circle, col.color);
                                // Continue recursion
                                recurse(baseC);
                            } else {
                                // If in a column, draw a line between them and end this branch of recusion
                                baseC.circle.attr({fill: baseCol.color});
                                drawLine(c.circle, baseC.circle, col.color);
                            }
                        }
                    }
                    function drawLine(circle, parentCircle, color) {
                        var start = {x: circle.asPX('cx'), y: circle.asPX('cy')};
                        var end = {x: parentCircle.asPX('cx'), y: parentCircle.asPX('cy')};
                        var pathStr = 'M' + start.x + ',' + (start.y + dvm.circleRadius);
                        if (start.x > end.x) {
                            pathStr += ' C' + start.x + ',' + (start.y + 3 * dvm.circleSpacing/4) + ' ' + end.x + ',' + (start.y + dvm.circleSpacing/4) + ' '
                                + end.x + ',' + (_.min([start.y + dvm.circleSpacing, end.y - dvm.circleRadius])) + ' L';
                        } else if (start.x < end.x) {
                            pathStr += ' L' + start.x + ',' + (_.max([end.y - dvm.circleSpacing, start.y + dvm.circleRadius])) + ' C' + start.x + ',' + (end.y - dvm.circleSpacing/4) + ' '
                                + end.x + ',' + (end.y - 3 * dvm.circleSpacing/4) + ' ';
                        } else {
                            pathStr += ' L';
                        }
                        pathStr += end.x + ',' + (end.y - dvm.circleRadius);
                        var path = snap.path(pathStr);
                        path.attr({
                            fill: 'none',
                            'stroke-width': 2,
                            stroke: color
                        });
                        wrapper.add(path);
                    }
                    function drawBranchTitle(circle) {
                        var cx = circle.asPX('cx'),
                            cy = circle.asPX('cy'),
                            r = circle.asPX('r');
                        var rect = snap.rect(cx - r - titleWidth - 5, cy - r - 5, titleWidth, 20, 5, 5);
                        rect.attr({
                            'fill-opacity': '0.5'
                        });
                        var triangle = snap.path('M' + (cx - r - 5) + ',' + (cy - r) + ' L' + (cx - r) + ',' + cy + ' L' + (cx - r - 5) + ',' + (cy + r));
                        triangle.attr({
                            'fill-opacity': '0.5'
                        });
                        var displayText = dvm.util.getDctermsValue(dvm.branch, 'title');
                        var title = Snap.parse('<title>' + displayText + '</title>');
                        var text = snap.text(rect.asPX('x') + (rect.asPX('width'))/2, rect.asPX('y') + (rect.asPX('height')/2), displayText);
                        text.attr({
                            'text-anchor': 'middle',
                            'alignment-baseline': 'central',
                            fill: '#fff'
                        });
                        while (text.getBBox().width > rect.asPX('width') - 5) {
                            displayText = displayText.slice(0, -1);
                            text.node.innerHTML = displayText + '...';
                        }
                        text.append(title);
                        wrapper.add(rect, triangle, text);
                    }
                }]
            }
        }
})();
