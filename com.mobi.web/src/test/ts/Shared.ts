/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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

import { Observable } from 'rxjs';
import 'hammerjs';

import { ControlRecordI } from '../../main/resources/public/ontology-visualization/interfaces/visualization.interfaces';
import { GraphState, StateNode, StateEdge } from  '../../main/resources/public/ontology-visualization/classes';

export function cleanStylesFromDOM(): void {
    const head: HTMLHeadElement = document.getElementsByTagName('head')[0];
    const styles: HTMLCollectionOf<HTMLStyleElement> | [] = head.getElementsByTagName('style');

    for (let i = 0; i < styles.length; i++) {
        head.removeChild(styles[i]);
    }
}

export class mockWindowRef {
    public nativeWindow = { open: jasmine.createSpy('open') };
    getNativeWindow = jasmine.createSpy('getNativeWindow').and.returnValue(this.nativeWindow);
}

export class MockOntologyVisualizationService {
    ERROR_MESSAGE: "ERROR_MESSAGE_1";
    IN_PROGRESS_COMMIT_MESSAGE: "IN_PROGRESS_COMMIT_MESSAGE_2";
    NO_CLASS_MESSAGE: "NO_CLASS_MESSAGE";
    spinnerId: 'ontology-visualization';
    DEFAULT_NODE_LIMIT: 100;

    public get graphStateCache(): Map<string, GraphState> {
       return jasmine.createSpyObj('graphStateCache',['get'], {
           get: jasmine.createSpy('get').and.callThrough(),
           has: jasmine.createSpy('has').and.returnValue(true)
       });
    }

    _sidePanelActionSubjectSubscription = jasmine.createSpyObj('Subscription', {
        'unsubscribe': jasmine.createSpy('Unsubscribe')
    })
    _sidePanelActionSubjectObservable = jasmine.createSpyObj('Observable', {
        'subscribe': this._sidePanelActionSubjectSubscription
    })
    sidePanelActionSubject$ = jasmine.createSpyObj('sidePanelActionSubject$', {
        'asObservable': this._sidePanelActionSubjectObservable,
        'next': jasmine.createSpy('next')
    });
    init = jasmine.createSpy('init').and.returnValue(new Observable<GraphState>( observer => {
            observer.complete();
        })
    );
    getOntologyNetworkObservable(): Observable<any> {
        throw new Error('getOntologyNetworkObservable not implemented.');
    }
    getOntologyLocalObservable(): Observable<any> {
        throw new Error('getOntologyLocalObservable not implemented.');
    }
    buildGraphData(commitGraphState: GraphState, hasInProgress: boolean): Observable<GraphState> {
        throw new Error('buildGraphData not implemented.');
    }
    buildGraph(classParentMap: any, childIris: any, entityInfo: any, classMap: any, ranges: any, hasInProgressCommit: boolean, localNodeLimit: number): { graphNodes: StateNode[]; graphEdges: StateEdge[]; allGraphNodes: ControlRecordI[]; } {
        throw new Error('buildGraph not implemented.');
    }
    getGraphState(commitId: string, error?: boolean): GraphState {
        throw new Error('getGraphState not implemented.');
    }
    getPropertyLabel: (propertyIri: any, entityInfo: any, hasInProgressCommit: any) => string;

    getGraphData = jasmine.createSpy('getGraphData').and.returnValue([
        {
            'selectable': true,
            'locked': false,
            'grabbed': false,
            'grabbable': true,
            'data': {
                'id': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#Pizza',
                'idInt': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#Pizza',
                'weight': 0,
                'name': 'Pizza'
            },
            'id': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#Pizza',
            'group': 'nodes',
            'ontologyId': 'http://www.co-ode.org/ontologies/pizza/pizza.owl'
        },
        {
            'selectable': true,
            'locked': false,
            'grabbed': false,
            'grabbable': true,
            'data': {
                'id': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#VegetableTopping',
                'idInt': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#VegetableTopping',
                'weight': 0,
                'name': 'CoberturaDeVegetais'
            },
            'id': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#VegetableTopping',
            'group': 'nodes',
            'ontologyId': 'http://www.co-ode.org/ontologies/pizza/pizza.owl'
        },
        {
            'selectable': true,
            'locked': false,
            'grabbed': false,
            'grabbable': true,
            'data': {
                'id': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#TomatoTopping',
                'idInt': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#TomatoTopping',
                'weight': 0,
                'name': 'CoberturaDeTomate'
            },
            'id': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#TomatoTopping',
            'group': 'nodes',
            'ontologyId': 'http://www.co-ode.org/ontologies/pizza/pizza.owl'
        },
        {
            'position': {},
            'group': 'edges',
            'removed': false,
            'selected': false,
            'selectable': true,
            'locked': false,
            'grabbed': false,
            'grabbable': true,
            'data': {
                'id': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#VegetableTopping-http://www.co-ode.org/ontologies/pizza/pizza.owl#TomatoTopping',
                'idInt': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#VegetableTopping-http://www.co-ode.org/ontologies/pizza/pizza.owl#TomatoTopping',
                'source': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#VegetableTopping',
                'target': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#TomatoTopping',
                'arrow': 'triangle',
                'weight': 0
            },
            'id': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#VegetableTopping-http://www.co-ode.org/ontologies/pizza/pizza.owl#TomatoTopping'
        },
        {
            'selectable': true,
            'locked': false,
            'grabbed': false,
            'grabbable': true,
            'data': {
                'id': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#SweetPepperTopping',
                'idInt': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#SweetPepperTopping',
                'weight': 0,
                'name': 'CoberturaDePimentaoDoce'
            },
            'id': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#SweetPepperTopping',
            'group': 'nodes',
            'ontologyId': 'http://www.co-ode.org/ontologies/pizza/pizza.owl'
        }
    ]);

}

export class mockStateManager {
    states = [];
    initialize = jasmine.createSpy('initialize');
    getStates = jasmine.createSpy('getStates').and.returnValue(Promise.resolve());
    createState = jasmine.createSpy('createState').and.returnValue(Promise.resolve());
    getState = jasmine.createSpy('getState').and.returnValue(Promise.resolve());
    updateState = jasmine.createSpy('updateState').and.returnValue(Promise.resolve());
    deleteState = jasmine.createSpy('deleteState').and.returnValue(Promise.resolve());
}