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

import { Component, Inject, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { OntologyVisualizationService } from '../../services/ontologyVisualizaton.service';
import './ontologyVisualization.component.scss';
import { Subscription } from 'rxjs';
import { GraphState, SidePanelAction, SidePanelPayload } from '../../services/visualization.interfaces';

/**
 * @class OntologyVisualization
 * Enable users to visually explore classes within an 
 * ontology and the ways they relate to one another
 * 
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

    public readonly spinnerId = 'ontology-visualization';
    private _toastrConfig = {
        timeOut: 0,
        extendedTimeOut: 0,
        preventDuplicates: true,
        closeButton: true,
        id: null
    };
    public hasInProgressCommit = false;

    public cyChart: any; // cytoscape instance
    public cyChartSize = 1;
    public cyLayout: any; // cytoscape layout

    private debounceTimeId: any;
    
    public graphCollections = {
        highlighted: new Set(),
        selectedNode: new Set(),
        selectedEdge: new Set()
    }
    public status = { 
        loaded: false, // Graph data was loaded
        initialized: false, // Cytoscape chart has been initialized
        hasWarningsMsg: false 
    }

    sidePanelActionSub$: Subscription; // Subscription to control cytoscape graph from different components

    constructor(private ovis: OntologyVisualizationService,  @Inject('utilService') private util,  @Inject('httpService') private http) {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes?.inProgress?.currentValue) {
            if (changes.inProgress.currentValue['additions'].length > 0  || 
                changes.inProgress.currentValue['deletions'].length > 0) {
                this.hasInProgressCommit = true;
            } else {
                this.hasInProgressCommit = false;
            }
        } else {
            this.hasInProgressCommit = false;
        }

        if (this.status.initialized) {
            this.clearErrorToasts();
            if (!changes.commitId && changes.branchId) {
                this.status.loaded = true; 
            } else if (changes.ontology || changes.commitId ) {
                this.status.loaded = false;
                if (changes.commitId && this.cyChart) {
                    this.updateGraphState(changes.commitId.previousValue);
                }
                
                const self = this;
                this.ovis.init(this.commitId, changes?.inProgress?.currentValue).subscribe({
                    next(commitGraphState: GraphState) { 
                       if (self.cyChart && commitGraphState.positioned) {
                            self.updateCytoscapeGraph(commitGraphState);
                        } else {
                            self.initGraph(commitGraphState);
                        }
                    },
                    error(reason) { 
                        self.clearGraph();
                        self.initFailed(reason);
                    }
                });
            } else if (this.hasInProgressCommit) {
                const state = this.ovis.getGraphState(this.commitId);
                this.updateMessages(state.isOverLimit, state.nodeLimit);
            }
        } 
    }
    
    ngOnInit(): void {
        const self = this;
        this.cyChart = this.createCytoscapeInstance();
        
        this.cyChart.ready(this.setChartBindings());
        this.sidePanelActionSub$ = this.ovis.sidePanelActionSubject$.asObservable()
            .subscribe(this.sidePanelActionObserver());

        // inProgress really only matters when initially creating the commitId graphState
        // Changes in ngOnChanges for inProgress does not affect the commit graphState
        this.ovis.init(this.commitId, this.inProgress).subscribe({
            next(commitGraphState: GraphState) {
                self.initGraph(commitGraphState);
                self.updateMessages(commitGraphState.isOverLimit, commitGraphState.nodeLimit);
            },
            error(reason) {
                self.status.initialized = true;
                self.util.clearToast();
                self.initFailed(reason);
            }
        });
    }

    ngOnDestroy(): void {
        this.util.clearToast();
        if (this.sidePanelActionSub$) {
            this.sidePanelActionSub$.unsubscribe();  
        }
        if (this.cyChart && this.status.initialized) {
            this.updateGraphState(this.commitId);
        }
    }
    
    /**
     * Create Cytoscape Instance
     * https://js.cytoscape.org/#core/initialisation
     * @returns cytoscape instance 
     */
    createCytoscapeInstance(){
        const container = <HTMLElement>document.querySelector('.ontology-visualization');
        return cytoscape({ // Recyling an instance will help to keep memory usage lower
            container,
            // textureOnViewport: true, // Option makes large graphs more responsive
            maxZoom: 5, // Helps with preventing user getting lost in the viewpoint
            minZoom: 0.05 
        });
    }

    /**
     * Graph Init Failed
     * @param reason reason of failure
     */
    private initFailed(reason: string): void{
        const commitGraphState = this.ovis.getGraphState(this.commitId);
        this.cyChartSize = commitGraphState.getElementsLength()
        this.util.createWarningToast(reason, this._toastrConfig);
        this.status.hasWarningsMsg = true;
        this.status.loaded = true;
    }

    /**
     * Observer Function for sidePanelActionSub
     * @returns Observer
     */
    sidePanelActionObserver() {
        const self = this;
        return {
            next: (payload: SidePanelPayload) => {
                try {
                    if (!self.status.loaded || !self.status.initialized)
                        return;
                    switch (payload.action) {
                        case SidePanelAction.ONTOLOGY_SELECT: {
                            // need to figure out how to ont node
                            // cy.elements("node[weight >= 50][height < 180]");
                            // cy.filter('node[name = "Jerry"]')
                            break;
                        }
                        case SidePanelAction.RECORD_SELECT: {
                            self.cyChart.elements().unselect();
                            const target = self.cyChart.$id(payload.controlRecord.id);
                            target.select();
                            self.focusElement(target, 'select', self.graphCollections); 
                            break;
                        }
                        case SidePanelAction.RECORD_CENTER: {
                            self.cyChart.animate({
                                fit: {
                                    eles: self.cyChart.$id(payload.controlRecord.id),
                                    padding: 300
                                }
                            }, {
                                duration: 1000
                            });
                            break;
                        }
                        case SidePanelAction.RECORD_CHECKED: {
                            // Need to add node type to controlRecord 
                            // checkbox next to an ontology will update the graph by adding nodes for all the classes listed beneath
                            // Selecting the checkbox next to a class will update the graph by adding a new node
                            break;
                        }
                        case SidePanelAction.RECORD_UNCHECKED: {
                            // checkbox next to a class is unchecked, the node is removed along with any incoming/outgoing links
                            break;
                        }
                        default: {
                            console.warn('Invalid choice');
                            break;
                        }
                    }
                } catch (error) {
                    console.error(error);  // Error needs to be catched so that subscriber don't unsubscribe
                }
            }
        };
    }
    
    /**
     * Clear Error Toasts from UI
     */
    private clearErrorToasts() {
        if (this.status.hasWarningsMsg) {
            this.util.clearToast();
            this.status.hasWarningsMsg = false;
        }
    }

    /**
     * Initialization of cytoscape's graph instance, data was initialized using this.ovis.init()
     * 
     * - https://js.cytoscape.org/#layout.run
     */
    initGraph(commitGraphState: GraphState): void {
        const layoutName = 'preset'; 
        const layout = this.createLayoutOptions(layoutName);
        this.cyLayout = this.cyChart.layout(layout);
        this.updateCytoscapeGraph(commitGraphState, true);
        this.cyLayout.run(); 
        this.status.initialized = true;
    }

    /**
     * Update Cytoscape Graph
     * This function is used to update the current cytoscape graph with new state
     * 
     * @param commitGraphState 
     */
    public updateCytoscapeGraph(commitGraphState: GraphState, init = false): void {
        if (!commitGraphState.positioned) {
            commitGraphState.d3ForceStaticLoad();
        }
        this.cyChartSize = commitGraphState.getElementsLength();
        this.clearGraph();
        this.cyChart.add(commitGraphState.data);
        this.cyChart.json({
            style: commitGraphState.style
        });
        if (!init) {
            this.updateMessages(commitGraphState.isOverLimit, commitGraphState.nodeLimit);
        }
        if (commitGraphState.positionData != undefined) {
            this.cyChart.json(commitGraphState.positionData )
        } else {
            this.cyChart.fit(); // https://js.cytoscape.org/#cy.fit
        }
        this.status.loaded = true;
    }

    /**
     * Update Graph State
     * Before loading next graph commit the current state should be saved
     * 
     * Usages:
     *  - ngOnDestroy: Save the state for next time the ontology opens up
     *  - ngOnChanges: Before loading next graph commit and switching to a different commitId save the state
     * 
     * @param commitId commit Id
     */
    updateGraphState(commitId: string): void {
        const cyChartJson = this.cyChart.json();
        const elements = cyChartJson.elements;
        const graphElements = {
            nodes: elements.nodes ? elements.nodes : [],
            edges: elements.edges ? elements.edges : []
        }
        const commitGraphState: GraphState = this.ovis.getGraphState(commitId);
        commitGraphState.data = graphElements;
        commitGraphState.positionData = { pan: cyChartJson.pan, zoom: cyChartJson.zoom };
    }

    /**
     * Add ClassToCollection 
     * @param collection 
     * @param nodes 
     * @param classes 
     */
    private addClassToCollection(collection, nodes, classes): void {
        collection.add(nodes);
        nodes.addClass(classes);
    }

    /**
     * clearHighlightedElements
     * Info https://github.com/cytoscape/cytoscape.js/blob/master/src/collection/index.js
     * @param collection Set of https://github.com/cytoscape/cytoscape.js/blob/master/src/collection/element.js
     * @param classes 
     */
    private clearHighlightedElements(collection: Set<any>, classes): void {
        if (collection.size > 0) {
            collection.forEach(entry => {
                entry.removeClass(classes);
            });
            collection.clear();
        } 
    };

    /**
     * Focus Cytoscape Elements
     * - https://js.cytoscape.org/#eles.select
     * 
     * @param target target element
     * @param action action string
     * @param highlighted highlight or select
     * @param selectedEdge set of edges that are selected
     * @param selectedNode set of nodes that are selected
     */
    private focusElement(target, action: string, graphCollections): void{
        const highlighted = graphCollections.highlighted;
        const selectedEdge = graphCollections.selectedEdge;
        const selectedNode = graphCollections.selectedNode;
        
        const edges = target.connectedEdges();
        const nodes = target.neighborhood();
        // clear style
        this.clearHighlightedElements(highlighted, 'highlighted');
        this.clearHighlightedElements(selectedEdge, 'highlighted');

        if (target) {
            this.addClassToCollection(selectedNode, target, 'focused');
        }

        // apply style 
        if (action === 'highlight') {
            this.addClassToCollection(highlighted, edges, 'highlighted');
            this.addClassToCollection(highlighted, nodes, 'highlighted');
        } else {
            edges.select();
            nodes.select();
        }
    }

    /**
     * Set Chart User Event Bindings, method gets called when cy.ready occurs
     * 
     * Infomation about different events types:
     * - https://js.cytoscape.org/#cy.ready
     * - https://js.cytoscape.org/#events/user-input-device-events
     * - https://js.cytoscape.org/#events/event-object
     * 
     * @param highlighted set of elements that are selected
     * @param selectedEdge set of edges that are selected
     * @param selectedNode set of nodes that are selected
     * @returns ReadyEvent Function
     */
    private setChartBindings() {
        const self = this;
        return (readyEvent) => {
            const chart = readyEvent.cy;
            chart.unbind('click');

            chart.bind('mouseover', 'node', function (event: { target: any }) {
                self.focusElement(event.target, 'highlight', self.graphCollections);
            });

            chart.bind('mouseout', 'node', function (event) {
                self.clearHighlightedElements(self.graphCollections.selectedNode, 'focused');
                self.clearHighlightedElements(self.graphCollections.highlighted, 'highlighted');
            });

            // bind tap to edges and add the highlighted class to connected nodes
            chart.bind('tap', 'edge', function (event: { target: any }) {
                const target = event.target;
                // clear style
                self.clearHighlightedElements(self.graphCollections.highlighted, 'highlighted');
                self.clearHighlightedElements(self.graphCollections.selectedEdge, 'highlighted');
                if (target.hasClass('ranges')) {
                    //add Style
                    self.addClassToCollection(self.graphCollections.selectedEdge, target.edges(), 'highlighted');
                    self.addClassToCollection(self.graphCollections.highlighted, target.connectedNodes(), 'highlighted');
                }
            });

            chart.on('tap', function (event: { target: any }) {
                const evtTarget = event.target;
                if (self.graphCollections.selectedEdge.size > 0 && evtTarget.group('edge')) {
                    self.clearHighlightedElements(self.graphCollections.selectedEdge, 'highlighted');
                    self.clearHighlightedElements(self.graphCollections.highlighted, 'highlighted');
                }
            });

            chart.on('click', 'node', function (event: { target: any; }) {
                clearTimeout(self.debounceTimeId);
                self.debounceTimeId = setTimeout(function () {
                    self.focusElement(event.target, 'select', self.graphCollections);
                }, 100);
            });
        };
    }

    /**
     * Create Layout Object
     * 
     * - https://js.cytoscape.org/#layouts/preset
     * 
     * @param layoutName 
     * @returns Layout Options Object
     */
    private createLayoutOptions(layoutName: string) {
        const self = this;
  
        return {
            name: layoutName,
            animate: false,
            fit: true,
            randomize: false,
            infinite: true,

            linkId: function id(d) { // https://github.com/d3/d3-force#link_id
                return d.id;
            },
            ready: function () {
                // empty
            },
            stop: function (nodes) {
                self.status.loaded = true;
            },
            tick: function (progress) {
                //empty
            }
        };
    }

    /**
     * Clear Cytoscape chart elements
     * @returns true if graph was cleared, false if it could not clear graph
     */
    public clearGraph(): boolean {
        if (this.cyChart?.elements) {
            this.cyChart.elements().remove();
            return true;
        } else {
            return false;
        }
    }

    /**
     * Update Messages
     * @param isOverLimit If has isOverLimit then warn user
     */
    public updateMessages(isOverLimit: boolean, nodeLimit: number): void {
        this.clearErrorToasts();
        
        if (this.hasInProgressCommit) {
            this.status.hasWarningsMsg = true;
            this.util.createWarningToast('Uncommitted changes will not appear in the graph', this._toastrConfig);
        }
        if (isOverLimit) {
            this.status.hasWarningsMsg = true;
            this.util.createWarningToast(`Maximum number of nodes reached. Only ${nodeLimit} nodes are being displayed`, this._toastrConfig);
        }
    }

}