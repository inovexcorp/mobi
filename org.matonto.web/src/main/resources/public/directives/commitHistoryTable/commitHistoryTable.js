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
         */
        .directive('commitHistoryTable', commitHistoryTable);

        commitHistoryTable.$inject = ['catalogManagerService', 'utilService', 'userManagerService', 'Snap'];

        function commitHistoryTable(catalogManagerService, utilService, userManagerService, Snap) {
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
                    dvm.error = '';
                    dvm.commits = [];
                    dvm.circleRadius = 5;
                    dvm.circleSpacing = 50;
                    dvm.columnSpacing = 25;
                    dvm.deltaX = 80 + dvm.circleRadius;
                    dvm.deltaY = 37;

                    $scope.$watchGroup(['dvm.branch', 'dvm.recordId', 'dvm.commitId'], newValues => {
                        dvm.getCommits();
                    });

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
                            _.forEach(dvm.commits, (commit, i) => {
                                var circle = snap.circle(0, dvm.circleSpacing/2 + (i * dvm.circleSpacing), dvm.circleRadius);
                                var title = Snap.parse('<title>' + dvm.util.condenseCommitId(commit.id) + '</title>')
                                circle.append(title);
                                wrapper.add(circle);
                                graphCommits.push({commit: commit, circle: circle});
                            });
                            var c = graphCommits[0];
                            var color = colors[colorIdx % colors.length];
                            colorIdx++;
                            c.circle.attr({fill: color});
                            cols.push({x: 0, commits: [c.commit.id], color: color});
                            drawBranchTitle(c.circle);
                            recurse(c);
                            dvm.deltaX += xI * dvm.columnSpacing;
                            _.forEach(graphCommits, (c, idx) => {
                                c.circle.attr({cx: c.circle.asPX('cx') + dvm.deltaX, cy: c.circle.asPX('cy') + dvm.deltaY});
                                var strokeWidth = idx === 0 ? '2' : '1';
                                drawDivider(c.circle, strokeWidth);
                            });
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
                        dvm.deltaX = 80 + dvm.circleRadius;
                    }

                    function recurse(c) {
                        var col = _.find(cols, col => _.includes(col.commits, c.commit.id));
                        var rightParent = c.commit.base;
                        var leftParent = c.commit.auxiliary;
                        if (leftParent) {
                            var leftC = _.find(graphCommits, {commit: {id: leftParent}});
                            var color = colors[colorIdx % colors.length];
                            colorIdx++;
                            leftC.circle.attr({cx: -dvm.columnSpacing * xI, fill: color});
                            cols.push({x: -dvm.columnSpacing * xI, commits: [leftParent], color: color});
                            xI++;
                            drawLine(c.circle, leftC.circle, color);
                            var rightC = _.find(graphCommits, {commit: {id: rightParent}});
                            rightC.circle.attr({cx: col.x, fill: col.color});
                            col.commits.push(rightC.commit.id);
                            drawLine(c.circle, rightC.circle, col.color);
                            recurse(rightC);
                            recurse(leftC);
                        } else if (rightParent) {
                            var rightC = _.find(graphCommits, {commit: {id: rightParent}});
                            var rightCol = _.find(cols, col => _.includes(col.commits, rightParent));
                            if (!rightCol) {
                                rightC.circle.attr({cx: col.x, fill: col.color});
                                col.commits.push(rightParent);
                                drawLine(c.circle, rightC.circle, col.color);
                                recurse(rightC);
                            } else {
                                rightC.circle.attr({fill: rightCol.color});
                                drawLine(c.circle, rightC.circle, col.color);
                            }
                        }
                    }
                    function drawLine(circle, parentCircle, color) {
                        var start = {x: circle.asPX('cx'), y: circle.asPX('cy')};
                        var end = {x: parentCircle.asPX('cx'), y: parentCircle.asPX('cy')};
                        var pathStr = 'M' + start.x + ',' + (start.y + dvm.circleRadius);
                        if (start.x > end.x) {
                            pathStr += ' C' + start.x + ',' + (start.y + 3 * dvm.circleSpacing/4) + ' ' + end.x + ',' + (start.y + dvm.circleSpacing/4) + ' ' + end.x + ',' + (start.y + dvm.circleSpacing) + ' L';
                        } else {
                            pathStr += ' L' + start.x + ',' + (end.y - dvm.circleSpacing) + ' C' + start.x + ',' + (end.y - dvm.circleSpacing/4) + ' ' + end.x + ',' + (end.y - 3 * dvm.circleSpacing/4) + ' ';
                        }
                        pathStr += end.x + ',' + (end.y - dvm.circleRadius);
                        var path = snap.path(pathStr);
                        path.attr({
                            fill: 'none',
                            'stroke-width': 2,
                            'stroke': color
                        });
                        wrapper.add(path);
                    }
                    function drawBranchTitle(circle) {
                        var cx = circle.asPX('cx'),
                            cy = circle.asPX('cy'),
                            r = circle.asPX('r');
                        var rect = snap.rect(cx - r - 80, cy - r - 5, 75, 20, 5, 5);
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
                            'fill': '#fff'
                        });
                        while (text.getBBox().width > rect.asPX('width') - 5) {
                            displayText = displayText.slice(0, -1);
                            text.node.innerHTML = displayText + '...';
                        }
                        text.append(title);
                        wrapper.add(rect, triangle, text);
                    }
                    function drawDivider(circle, strokeWidth) {
                        var lineY = circle.asPX('cy') - dvm.circleSpacing/2;
                        var line = snap.line(0, lineY, dvm.deltaX + 10, lineY);
                        line.attr({
                            'stroke': '#ddd',
                            'stroke-width': strokeWidth
                        });
                        wrapper.insertBefore(line);
                    }
                }]
            }
        }
})();
