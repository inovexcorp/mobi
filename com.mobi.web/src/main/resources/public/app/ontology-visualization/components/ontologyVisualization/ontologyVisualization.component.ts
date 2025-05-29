/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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

import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    HostListener,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    SimpleChanges,
    ViewChild
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import cytoscape from 'cytoscape/dist/cytoscape.esm.js';
import { Subscription } from 'rxjs';

import { D3Node, D3NodeIndex } from '../../classes/d3Classes';
import { D3SimulatorService } from '../../services/d3Simulator.service';
import { GraphState, StateNode } from '../../classes';
import { GraphStateDataI } from '../../classes/graphState';
import { OntologyVisualizationService } from '../../services/ontologyVisualization.service';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { SidePanelAction, SidePanelPayloadI } from '../../classes/sidebarState';
import { SimulationOptions } from '../../interfaces/simulation.interface';
import { ToastService } from '../../../shared/services/toast.service';
import { VisualizationHelpModal } from '../visualization-help-modal/visualization-help-modal.component';

/**
 * @class ontology-visualization.OntologyVisualization
 * 
 * Enable users to visually explore classes within an 
 * ontology and the ways they relate to one another
 * 
 * @requires ontology-visualization.OntologyVisualizationService
 */
@Component({
    selector: 'ontology-visualization',
    templateUrl: './ontologyVisualization.component.html',
    styleUrls: ['./ontologyVisualization.component.scss'],
    changeDetection: ChangeDetectionStrategy.Default
})
export class OntologyVisualization implements OnInit, OnDestroy, OnChanges {
    @Input() ontologyId;
    @Input() commitId;
    @Input() branchId;
    @Input() inProgress;
    @ViewChild('ontologyVis') ontoVis: ElementRef;
    @HostListener('wheel', ['$event'])
    onWheelEvent = (event: WheelEvent): void => {
        this.initialZoomLevel = this.cyChart.zoom();
    }

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
        selectedNeighbor: new Set()
    }
    public status = { 
        loaded: false, // Graph data was loaded
        initialized: false, // Cytoscape chart has been initialized
        hasWarningsMsg: false 
    }
    sidePanelActionSub$: Subscription; // Subscription to control cytoscape graph from different components
    newNodeWithPositionAdded = false;
    initialZoomLevel = 0;

    constructor(private ovis: OntologyVisualizationService,
        private d3Simulator: D3SimulatorService,
        private toast: ToastService,
        private dialog: MatDialog,
        private cf: ChangeDetectorRef,
        private spinnerSrv : ProgressSpinnerService) {}

    ngOnInit(): void {
        const self = this;
        this.cyChart = this.createCytoscapeInstance();
        this.cyChart.ready(this.setChartBindings());
        this.sidePanelActionSub$ = this.ovis.sidePanelActionAction$
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
                self.toast.clearToast();
                self.initFailed(reason);
            }
        });
        if (this.cyChart) {
            this.initialZoomLevel = this.cyChart.zoom();
        }
    }
    /**
     * ngOnChanges Lifecycle hook 
     * Occurs when: (ontology, commitId, branchId, inProgress) are changed
     * - Switching between ontologies
     * @param changes SimpleChanges
     */
    ngOnChanges(changes: SimpleChanges): void {
        //@TODO Fix double loader indicator
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
            } else if (changes.ontologyId || changes.commitId ) {
                this.status.loaded = false;
                if (changes.commitId && this.cyChart) {
                    this.updateGraphState(changes.commitId.previousValue);
                }
                
                const self = this;
                this.ovis.init(this.commitId, changes?.inProgress?.currentValue).subscribe({
                    next(commitGraphState: GraphState) { 
                       if (self.cyChart && commitGraphState.positioned) {
                           self.updateCytoscapeGraph(commitGraphState, false, {preProcessClustering: true});
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
            this.initialZoomLevel = this.cyChart.zoom();
        }
    }
    ngOnDestroy(): void {
        this.toast.clearToast();
        if (this.sidePanelActionSub$) {
            this.sidePanelActionSub$.unsubscribe();  
        }
        if (this.cyChart && this.status.initialized && this.ovis.graphStateCache.has(this.commitId)) {
            this.updateGraphState(this.commitId);
        }
    }
    /**
     * Create Cytoscape Instance
     * https://js.cytoscape.org/#core/initialisation
     * @returns cytoscape instance 
     */
    createCytoscapeInstance():any {
        const container = <HTMLElement>document.querySelector('.ontology-visualization');
        return cytoscape({ // Recyling an instance will help to keep memory usage lower
            container,
            // textureOnViewport: true, // Option makes large graphs more responsive
            maxZoom: 4, // Helps with preventing user getting lost in the viewpoint
            minZoom: 0.05 
        });
    }
    /**
     * Graph Init Failed
     * @param reason reason of failure
     */
    private initFailed(reason: string): void{
        const commitGraphState = this.ovis.getGraphState(this.commitId);
        this.cyChartSize = commitGraphState.getElementsLength();
        this.toast.createWarningToast(reason, this._toastrConfig);
        this.status.hasWarningsMsg = true;
        this.status.loaded = true;
    }
    /**
     * Observer Function for SidePanelAction subject
     * 
     * Respond to {@link SidePanelAction} actions
     * 
     * @returns Observer
     */
    sidePanelActionObserver(): { next: any } {
        const self = this;
        return {
            next: (payload: SidePanelPayloadI) => {
                try {
                    if (!self.status.initialized) {
                        console.info('OntologyVisualization component was not initialized');
                        return;
                    }
                    const currentGraphState = this.ovis.getGraphState(this.commitId);
                    switch (payload.action) {
                        case SidePanelAction.ONTOLOGY_SELECT: {
                            // TODO need to figure out how to ont node
                            // cy.elements("node[weight >= 50][height < 180]");
                            // cy.filter('node[name = "Jerry"]')
                            break;
                        }
                        case SidePanelAction.ONTOLOGY_CHECKED: {
                            self.status.loaded = false;
                            const ontologyId = payload.ontology.ontologyId;
                            const graphStateDataOntology: GraphStateDataI = currentGraphState.getFilteredGraphData({ontologyId});
                            this.cyChart.add(graphStateDataOntology);
                            const options: SimulationOptions = {
                                useExistingNodeLocation: true,
                            };
                            this.runSimulationOnGraphState(currentGraphState, options);
                            self.status.loaded = true;
                            self.cf.markForCheck();
                            break;
                        }
                        case SidePanelAction.ONTOLOGY_UNCHECKED: {
                            const record = payload.ontology;
                            const elesNodes = this.getOntologyGraphElements(record.ontologyId);
                            elesNodes.elements.remove();
                            self.cf.markForCheck();
                            break;
                        }
                        case SidePanelAction.RECORD_SELECT: {
                            self.cyChart.elements().unselect();
                            self.clearNodeStyle();
                            const target = self.cyChart.$id(payload.controlRecord.id);
                            target.select();
                            self.focusElement(target, 'select', self.graphCollections);
                            self.cf.markForCheck();
                            break;
                        }
                        case SidePanelAction.RECORD_CENTER: {
                            self.cyChart.animate({
                                fit: {
                                    eles: self.cyChart.$id(payload.controlRecord.id),
                                    padding: 100,
                                }
                            }, {
                                duration: 1000,
                                complete: () => {
                                    self.initialZoomLevel = self.cyChart.zoom();
                                    self.cf.markForCheck();
                                }
                            });
                            self.cf.markForCheck();
                            break;
                        }
                        /**
                         * Need to add node type to controlRecord
                         * checkbox next to an ontology will update the graph by adding nodes for all the classes listed beneath
                         * Selecting the checkbox next to a class will update the graph by adding a new node
                         */
                        case SidePanelAction.RECORD_CHECKED: {
                            self.status.loaded = false;
                            const record = payload.controlRecord;
                            const graphStateDataI: GraphStateDataI = currentGraphState.getFilteredGraphData({recordId: record.id});
                            this.cyChart.add(graphStateDataI);
        
                            if (!Object.prototype.hasOwnProperty.call(record.stateNode, 'position') || self.newNodeWithPositionAdded ===true) {
                                const options: SimulationOptions = {
                                    useExistingNodeLocation: true,
                                };
                                this.runSimulationOnGraphState(currentGraphState, options);
                                self.newNodeWithPositionAdded = true;
                            } else if (self.newNodeWithPositionAdded) {
                                // Needed because past simulation could conflict with existing nodes that are positioned but not on the graph
                                // Nodes that are not on the graph but have position data are not used for simulation
                                const options: SimulationOptions = {
                                    useExistingNodeLocation: true,
                                };
                                this.runSimulationOnGraphState(currentGraphState, options);
                                self.newNodeWithPositionAdded = false;
                            }
                            self.status.loaded = true;
                            break;
                        }
                        /**
                         * checkbox next to a class is unchecked, the node is removed along with any incoming/outgoing links
                         */
                        case SidePanelAction.RECORD_UNCHECKED: {
                            self.cyChart.elements().unselect();
                            self.clearNodeAndSelectAction();
                            const record = payload.controlRecord;
                            record.inInitialGraph = false;
                            record.onGraph = false;
                            const elements = this.cyChart.elements().nodes(`[id="${record.id}"]`);
                            this.cyChart.remove(elements);
                            break;
                        }
                        default: {
                            console.warn('Invalid choice');
                            break;
                        }
                    }
                } catch (error) {
                    console.error(error);  // Error needs to be caught so that subscriber don't unsubscribe
                }
            }
        };
    }
    /**
     * Search cyChart for nodes with ontologyId
     * @param ontologyId 
     * @returns elements
     */
    private getOntologyGraphElements(ontologyId:string): {elements: any} {
        const selector = `[ontologyId="${ontologyId}"]`;
        const elements = this.cyChart.elements(selector);
        const collection = {
            elements
        };
        return collection;
    }
    /**
     * Clear Error Toasts from UI
     */
    private clearErrorToasts(): void {
        if (this.status.hasWarningsMsg) {
            this.toast.clearToast();
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
        this.updateCytoscapeGraph(commitGraphState, true, {preProcessClustering: true});
        this.cyLayout.run();
        this.status.initialized = true;
        if (commitGraphState.selectedNodes) {
           const selectedNode =  this.cyChart.$('.focused');
           const neighborhood = selectedNode.neighborhood();
            if (neighborhood && neighborhood.length > 0) {
                this.graphCollections.selectedNeighbor.add(neighborhood);
            }
            this.graphCollections.selectedNode.add(selectedNode);
            this.ovis.emitSelectAction({
                action: SidePanelAction.RECORD_SELECT,
                nodeId: selectedNode.id()
            });
        }
    }
    /**
     * Run D3-Force Simulation On GraphState
     * Info about Cytoscape node positions: https://js.cytoscape.org/#nodes.positions
     * 
     * NOTE: Mutating state by object references
     * @return Time it took to run simulation
     */
    runSimulationOnGraphState(graphState: GraphState, simulationOptions?: SimulationOptions, refreshPositions=true): number {
        const start = new Date().getTime();
        const graphStateData: GraphStateDataI = graphState.getFilteredGraphData();
        const nodePositionMapping: D3NodeIndex = this.d3Simulator.runSimulation(graphStateData, simulationOptions);
        graphStateData.nodes.forEach((stateNode: StateNode) => {
            stateNode.position = nodePositionMapping[stateNode.data.id];  // Mutating by Object Reference
        });
        if (this.cyChart && refreshPositions) {
            this.cyChart.nodes().positions(function(node){
                const d3NodePosition: D3Node = nodePositionMapping[node.id()];
                if (d3NodePosition){
                    return {
                        x: d3NodePosition?.x || 0,
                        y: d3NodePosition?.y || 0
                    };
                } else {
                    return node.position();
                }
            });
        }
        graphState.positioned = true; // The idea of positioned graph should be check as nodes check added to graph 
        return new Date().getTime() - start;
    }
    /**
     * Update Cytoscape Graph
     * This function is used to update the current cytoscape graph with new state
     * 
     * @param commitGraphState 
     */
    public updateCytoscapeGraph(commitGraphState: GraphState, init = false, simulationOptions?: SimulationOptions): void {
        if (!commitGraphState.positioned) {
            this.runSimulationOnGraphState(commitGraphState, simulationOptions, false);
        }
        this.cyChartSize = commitGraphState.getElementsLength();
        this.clearGraph();
        this.cyChart.add(commitGraphState.getFilteredGraphData());
        this.cyChart.json({
            style: commitGraphState.style
        });
        if (!init) {
            this.updateMessages(commitGraphState.isOverLimit, commitGraphState.nodeLimit);
        }
        if (commitGraphState.positionData !== undefined) {
            this.cyChart.json(commitGraphState.positionData );
        } else {
            this.cyChart.fit(); // https://js.cytoscape.org/#cy.fit
            this.initialZoomLevel = this.cyChart.zoom();
        }
        this.cf.markForCheck(); // Needed so that graph shows
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
        const commitGraphState: GraphState = this.ovis.getGraphState(commitId);
        commitGraphState.selectedNodes = this.graphCollections.selectedNode.size > 0;
        const cyChartJson = this.cyChart.json();
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
     * clearCollectionElements
     * Info https://github.com/cytoscape/cytoscape.js/blob/master/src/collection/index.js
     * @param collection Set of https://github.com/cytoscape/cytoscape.js/blob/master/src/collection/element.js
     */
    clearCollectionElements(collection: Set<any>): void {
        if (collection.size > 0) {
            collection.clear();
        } 
    }
    /**
     * Remove class from element.
     * ClassName { string } represents the token to be removed.
     * @param collection 
     * @param className 
     */
    private removeItemFormCollection(collection, className: string): void {
        if (collection.hasClass(className)) {
            collection.removeClass(className);
        }
    }
    /**
     * Remove class from collection
     * @param collection
     * @param classes
     * @param action
     * @private
     */
    private removeCollectionClass(collection: Set<any>, classes): void {
        const getExclusiveState = {
            'highlighted': 'focused',
            'focused': 'highlighted',
        };
        const exClass = getExclusiveState[classes];
        if (collection.size > 0) {
            collection.forEach(entry => {
                // check if entry is a single node or collection.
                if (entry.length > 1) {
                    entry.forEach(i => {
                        this.removeItemFormCollection(i, classes);
                    });
                    collection.delete(entry);
                } else {
                    this.removeItemFormCollection(entry, classes);
                    const hasOtherClass = entry.filter(function( ele ){
                        return ele.hasClass(exClass);
                    });
                    if (hasOtherClass.length === 0) {
                        collection.delete(entry);
                    }
                }
            });
        }
    }
    /**
     * Focus Cytoscape Elements
     * - https://js.cytoscape.org/#eles.select
     * 
     * @param target target element
     * @param action action string
     * @param highlighted highlight or select
     * @param selectedNeighbor set of edges that are selected
     * @param selectedNode set of nodes that are selected
     */
    private focusElement(target: any, action: string, graphCollections: any): void{
        const highlighted = graphCollections.highlighted;
        const selectedNeighbor = graphCollections.selectedNeighbor;
        const selectedNode = graphCollections.selectedNode;
        const neighborhood = target.neighborhood();
        // clear style
        this.removeCollectionClass(highlighted, 'highlighted');
        this.removeCollectionClass(selectedNeighbor, 'highlighted');
        this.removeCollectionClass(selectedNode, 'highlighted');

        if (target) {
            if (action === 'select') {
                this.removeCollectionClass(selectedNode, 'focused');
                this.addClassToCollection(selectedNode, target, 'focused');
                this.addClassToCollection(selectedNeighbor, neighborhood, 'highlighted');
                neighborhood.select();
            } else {
                this.addClassToCollection(highlighted, neighborhood, 'highlighted');
                this.addClassToCollection(highlighted, target, 'highlighted');
            }
        }
    }
    private clearNodeStyle():void{
        if (this.graphCollections.selectedNeighbor.size > 0) {
            this.graphCollections.selectedNeighbor.forEach((item:any) => {
                item.unselect();
            });
            this.removeCollectionClass(this.graphCollections.selectedNeighbor, 'highlighted');
            this.removeCollectionClass(this.graphCollections.selectedNeighbor, 'focused');
        }
        if (this.graphCollections.highlighted.size > 0) {
            this.removeCollectionClass(this.graphCollections.highlighted, 'highlighted');
        }
        if (this.graphCollections.selectedNode.size > 0) {
            this.graphCollections.selectedNode.forEach((item:any) => {
                item.unselect();
            });
            this.removeCollectionClass(this.graphCollections.selectedNode, 'focused');
        }
    }
    /**
     *  Clear node style
     *  Clear sidePanel selected node
     * @private
     */
    private clearNodeAndSelectAction() {
        this.clearNodeStyle();
        this.ovis.emitSelectAction({action: SidePanelAction.RECORD_SELECT, nodeId: ''});
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
     * @param selectedNeighbor set of edges that are selected
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
                clearTimeout(self.debounceTimeId);
                self.removeCollectionClass(self.graphCollections.selectedNode, 'highlighted');
                self.removeCollectionClass(self.graphCollections.highlighted, 'highlighted');
            });
            // bind tap to edges and add the highlighted class to connected nodes
            chart.bind('tap', 'edge', function (event: { target: any }) {
                const target = event.target;
                // clear style
                self.removeCollectionClass(self.graphCollections.highlighted, 'highlighted');
                self.removeCollectionClass(self.graphCollections.selectedNeighbor, 'highlighted');
                if (target.hasClass('ranges')) {
                    //add Style
                    self.addClassToCollection(self.graphCollections.selectedNeighbor, target.edges(), 'highlighted');
                    self.addClassToCollection(self.graphCollections.highlighted, target.connectedNodes(), 'highlighted');
                }
            });
            chart.on('tap', function (event: { target: any }) {
                if (self.graphCollections.selectedNeighbor.size > 0 || self.graphCollections.selectedNode.size > 0) {
                   self.clearNodeAndSelectAction();
                }
            });
            chart.on('click', 'node', function (event: { target: any }) {
                clearTimeout(self.debounceTimeId);
                self.debounceTimeId = setTimeout(function () {
                    self.focusElement(event.target, 'select', self.graphCollections);
                    self.ovis.emitSelectAction({action: SidePanelAction.RECORD_SELECT, nodeId: event.target.id()});
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
            },
            stop: function () {
                self.status.loaded = true;
                self.spinnerSrv.finishLoadingForComponent(self.ontoVis);
            },
            tick: function () {
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
            this.toast.createWarningToast('Uncommitted changes will not appear in the graph', this._toastrConfig);
        }
        if (isOverLimit) {
            this.status.hasWarningsMsg = true;
            this.toast.createWarningToast(`Maximum number of nodes reached. Only ${nodeLimit} nodes are being displayed`, this._toastrConfig);
        }
    }
    openHelpDialog() {
        this.dialog.open(VisualizationHelpModal);
    }
}
