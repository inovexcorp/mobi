/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
import cytoscape from 'cytoscape/dist/cytoscape.esm.js';
import * as d3Force from 'cytoscape-d3-force';
import  { style } from './graphSettings';
import { Component, Inject, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { OntologyVisualizationService } from '../services/ontologyVisualizaton.service';
import './ontologyVisualization.component.scss';

/**
 * @class OntologyVisualization
 * Enable users to visually explore classes within an 
 * ontology and the ways they relate to one another
 * @requires shared.service:ontologyVisualizaton
 * `OntologyVisualization`
 */
@Component({
    selector: 'ontologyVisualization',
    templateUrl: './ontologyVisualization.component.html'
})
export class OntologyVisualization implements OnInit, OnDestroy, OnChanges {
    @Input() ontology;
    @Input() commitId;
    @Input() branchId;
    @Input() inProgress;
    chart: any;
    data: any = [];
    layout = 'd3-force';
    isLoaded = false;
    hasInit = false ;
    spinnerId = 'ontology-visualization'
    hasInProgressCommit = false;
    isOverLimit = false;
    length = 1;
    timeout;
    hasWarningsMsg = false;
    toastrConfig  = {
        timeOut: 0,
        extendedTimeOut: 0,
        preventDuplicates: true,
        closeButton: true,
        id: null
    }

    constructor(private ovis: OntologyVisualizationService,  @Inject('utilService') private util) {}

    ngOnInit(): void {
        this.ovis.init().then(() => {
            this.initGraph();
        }).catch(reason => {
            this.hasInit = true;
            this.hasWarningsMsg = true;
            this.util.clearToast();
            this.length = this.ovis.hasClasses() ? this.getElementsLength(this.ovis.getGraphData()) : 0;
            this.util.createWarningToast(reason, this.toastrConfig);
            this.isLoaded = true;
        });
    }

    ngOnDestroy(): void {
        this.util.clearToast();
        if (this.chart && this.hasInit) {
            this.updateGraphData(this.chart.json().elements, true);
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (this.hasInit) {
            if (this.hasWarningsMsg) {
                this.util.clearToast();
            }
            if (changes.ontology || changes.commitId  || changes.branchId ) {
                this.isLoaded = false;
                if (this.chart) {
                    this.updateGraphData(this.chart.json().elements, true);
                }
                this.ovis.init().then(() => {
                    if (this.chart && this.ovis.hasPositions()  ) {
                        this.updateGraph();
                    } else {
                        this.initGraph();
                    }
                }).catch(reason => {
                    this.clearGraph();
                    this.hasWarningsMsg = true;
                    this.length = this.ovis.hasClasses() ? this.getElementsLength(this.ovis.getGraphData()) : 0;
                    this.util.createWarningToast(reason, this.toastrConfig);
                    this.isLoaded = true;
                });
            }
            if (changes.inProgress && changes.inProgress.currentValue ) {
                this.util.clearToast();
                this.ovis.updateInProgressCommit();
                if (!this.ovis.hasInProgressCommit && changes.branchId === undefined) {
                    this.isLoaded = false;
                    this.initGraph();
                }
                if (changes.ontology === undefined 
                    && changes.commitId  === undefined 
                    && changes.branchId  === undefined 
                    && this.ovis.hasInProgressCommit) {
                    this.updateMessages();
                }
            }
        }
    }

    initGraph() : void {
        const self = this;
        const elements = this.ovis.getGraphData();
        const layoutName = this.ovis.hasPositions() ? 'preset' : this.layout;
        const container = <HTMLElement>document.querySelector('.ontology-visualization');
        this.length = this.getElementsLength(elements);
        const layout = {
            name: layoutName,
            animate: false,
            fit: false,
            maxSimulationTime: 0,
            collideIterations: 1, // sets the number of iterations per application to the specified number
            avoidOverlap: true, // if true, prevents overlap of node bounding boxes
            handleDisconnected: true, // if true, avoids disconnected components from overlapping
            convergenceThreshold: 0.01, // when the alpha value (system energy) falls below this value, the layout stops
            nodeSpacing: function( node ) { 
                return 6000; 
            }, // extra spacing around nodes
            linkId: function id(d) {
                return d.id;
            },
            linkDistance: 300,
            nodeRepulsion: 500000,
            manyBodyStrength: -1000,
            ready: function(){
                // empty
            },
            stop: function(nodes) {
                self.isLoaded = true;
                self.updateMessages();
            },
            tick: function(progress) {
                //empty
            },
            randomize: false,
            infinite: true
        };

        cytoscape.use(d3Force);

        this.chart = cytoscape({
            container,
            layout,
            elements,
            style,
        });

        const chart = this.chart;
        const highlighted = new Set();
        const selectedNode = new Set();
        const selectedEdge = new Set();
        this.hasInit = true;
        chart.ready(function() {
            chart.unbind('click');
            const addClassToCollection = (collection, nodes, classes) => {
                collection.add(nodes);
                nodes.addClass(classes);
            };
            const clearHighlightedElements = (collection, classes) => {
                if (collection.size > 0) {
                    collection.forEach(entry => {
                        entry.removeClass(classes);
                    });
                    collection.clear();
                }    
            };
            const selectNodes = () => {
                chart.on('click', 'node', function(event) {
                    clearTimeout( this.timeout );
                    this.timeout = setTimeout(function(){
                        focusElement(event.target, 'select');
                    }, 100);
                });
            };
            const focusElement = (target, action) => {

                const edges = target.connectedEdges();
                const nodes = target.neighborhood();
                // clear style
                clearHighlightedElements(highlighted, 'highlighted');
                clearHighlightedElements(selectedEdge, 'highlighted');

                if (target) {
                    addClassToCollection(selectedNode, target, 'focused'); 
                }
                
                // apply style 
                if (action === 'highlight') {
                    addClassToCollection(highlighted, edges, 'highlighted');
                    addClassToCollection(highlighted, nodes, 'highlighted');
                } else {
                    edges.select();
                    nodes.select();
                }
            };

            chart.bind('mouseover', 'node', function(event) {
                focusElement(event.target, 'highlight');
            });

            chart.bind('mouseout', 'node', function(event) {
                clearHighlightedElements(selectedNode, 'focused');
                clearHighlightedElements(highlighted, 'highlighted');
            });

            // bind tap to edges and add the highlighted class to connected nodes
            chart.bind('tap', 'edge', function(event) {
                const target = event.target;
                // clear style
                clearHighlightedElements(highlighted, 'highlighted');
                clearHighlightedElements(selectedEdge, 'highlighted');
                if (target.hasClass('ranges')) { 
                    //add Style
                    addClassToCollection(selectedEdge, target.edges(), 'highlighted');
                    addClassToCollection(highlighted, target.connectedNodes(), 'highlighted');
                }
            });

            chart.on('tap', function(event){
                const evtTarget = event.target;
                if (selectedEdge.size > 0 && evtTarget.group('edge')) {
                    clearHighlightedElements(selectedEdge, 'highlighted');
                    clearHighlightedElements(highlighted, 'highlighted');
                }
              });
            selectNodes();
        });
    }

    clearNodesStyle(nodes) {
        nodes.classes([]);
    }

    updateGraphData(data, positioned = false) {
        if (data && data.nodes) {
            const grapElements = {
                nodes: data.nodes,
                edges: data.edges
            };
            this.ovis.setGraphState(grapElements, positioned);
        }
    }

    updateGraph() {
        this.clearGraph();
        const elements = this.ovis.getGraphData();
        this.length = this.getElementsLength(elements);
        this.chart.add(elements);
        this.isLoaded = true;
        this.updateMessages();
    }

    clearGraph() {
        if (this.chart && this.chart.elements) {
            this.chart.elements().remove();
        }
    }

    updateMessages() {
        if (this.hasWarningsMsg) {
            this.util.clearToast();
        }
        // reset value
        this.hasWarningsMsg = false;

        if (this.ovis.hasInProgressCommit) {
            this.hasWarningsMsg = true;
            this.util.createWarningToast('Uncommitted changes will not appear in the graph', this.toastrConfig);
        }
        if (this.ovis.isOverLimit) {
            this.hasWarningsMsg = true;
            this.util.createWarningToast(`Maximum number of nodes reached. Only ${this.ovis.nodesLimit} nodes are being displayed`, this.toastrConfig);
        }
    }

    setLoadingIndicator (val) {
        this.isLoaded = val;
    }

    private getElementsLength(elements) {
        if ( elements ) {
            return elements.length || (Object.prototype.hasOwnProperty.call(elements, 'nodes') ? elements.nodes.length : 0);
        } else {
            return 0;
        }
    }
}