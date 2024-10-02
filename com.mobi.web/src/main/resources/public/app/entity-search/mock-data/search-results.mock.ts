/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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
import { EntityRecord } from '../models/entity-record';

export const SearchResultsMock: EntityRecord[] = [
  {
    iri: 'http://www.co-ode.org/ontologies/pizza/pizza.owl#IceCream',
    entityName: 'Sorvete',
    types: [
      'http://www.w3.org/2002/07/owl#Class'
    ],
    description: 'A class to demonstrate mistakes made with setting a property domain. The property hasTopping has a domain of Pizza. This means that the reasoner can infer that all individuals using the hasTopping property must be of type Pizza. Because of the restriction on this class, all members of IceCream must use the hasTopping property, and therefore must also be members of Pizza. However, Pizza and IceCream are disjoint, so this causes an inconsistency. If they were not disjoint, IceCream would be inferred to be a subclass of Pizza.',
    record: {
      type: 'http://mobi.com/ontologies/ontology-editor#OntologyRecord',
      title: 'pizza',
      iri: 'https://mobi.com/records#f127368a-18dc-498f-a857-ae8c161d159b',
      keywords: []
    },
    matchingAnnotations: [
      {
        prop: 'http://www.w3.org/2000/01/rdf-schema#comment',
        value: 'A class to demonstrate mistakes made with setting a property domain. The property hasTopping has a domain of Pizza. This means that the reasoner can infer that all individuals using the hasTopping property must be of type Pizza. Because of the restriction on this class, all members of IceCream must use the hasTopping property, and therefore must also be members of Pizza. However, Pizza and IceCream are disjoint, so this causes an inconsistency. If they were not disjoint, IceCream would be inferred to be a subclass of Pizza.'
      }
    ],
    totalNumMatchingAnnotations: 1
  },
  {
    iri: 'http://www.co-ode.org/ontologies/pizza/pizza.owl#Cheese',
    entityName: 'Queijo',
    types: [
      'http://www.w3.org/2002/07/owl#Class'
    ],
    description: 'A class representing different types of cheese used as toppings on pizzas. This class includes various cheese types like mozzarella, cheddar, and parmesan.',
    record: {
      type: 'http://mobi.com/ontologies/ontology-editor#OntologyRecord',
      title: 'pizza',
      iri: 'https://mobi.com/records#b237d8a9-3c4d-4b8e-9f8e-2a8c161d159b',
      keywords: ['cheese', 'topping']
    },
    matchingAnnotations: [
      {
        prop: 'http://www.w3.org/2000/01/rdf-schema#comment',
        value: 'A class representing different types of cheese used as toppings on pizzas. This class includes various cheese types like mozzarella, cheddar, and parmesan.'
      }
    ],
    totalNumMatchingAnnotations: 1
  },
  {
    iri: 'http://www.co-ode.org/ontologies/pizza/pizza.owl#TomatoSauce',
    entityName: 'Molho de Tomate',
    types: [
      'http://www.w3.org/2002/07/owl#Class'
    ],
    description: 'A class for different types of tomato sauces used as bases for pizzas. This includes marinara, arrabbiata, and other tomato-based sauces.',
    record: {
      type: 'http://mobi.com/ontologies/ontology-editor#OntologyRecord',
      title: 'pizza',
      iri: 'https://mobi.com/records#c347d8a9-4d5e-4b8e-9f8e-3b8c161d159b',
      keywords: ['sauce', 'tomato']
    },
    matchingAnnotations: [
      {
        prop: 'http://www.w3.org/2000/01/rdf-schema#comment',
        value: 'A class for different types of tomato sauces used as bases for pizzas. This includes marinara, arrabbiata, and other tomato-based sauces.'
      }
    ],
    totalNumMatchingAnnotations: 1
  },
  {
    iri: 'http://www.co-ode.org/ontologies/pizza/pizza.owl#Pepperoni',
    entityName: 'Pepperoni',
    types: [
      'http://www.w3.org/2002/07/owl#Class'
    ],
    description: 'A class for pepperoni, a popular pizza topping made from cured pork and beef seasoned with paprika or other chili pepper.',
    record: {
      type: 'http://mobi.com/ontologies/ontology-editor#OntologyRecord',
      title: 'pizza',
      iri: 'https://mobi.com/records#d457d8a9-5e6f-4b8e-9f8e-4c8c161d159b',
      keywords: ['pepperoni', 'topping']
    },
    matchingAnnotations: [
      {
        prop: 'http://www.w3.org/2000/01/rdf-schema#comment',
        value: 'A class for pepperoni, a popular pizza topping made from cured pork and beef seasoned with paprika or other chili pepper.'
      }
    ],
    totalNumMatchingAnnotations: 1
  }
];
