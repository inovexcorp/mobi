package com.mobi.workflows.impl.dagu.actions;

/*-
 * #%L
 * com.mobi.workflows.impl.dagu
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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

import static org.junit.Assert.assertEquals;

import com.mobi.exception.MobiException;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.workflows.api.action.ActionDefinition;
import com.mobi.workflows.api.ontologies.workflows.Action;
import org.eclipse.rdf4j.model.IRI;
import org.junit.Test;

public class DaguActionDefinitionTest extends OrmEnabledTestCase {
    private final OrmFactory<Action> actionFactory = getRequiredOrmFactory(Action.class);
    private final IRI actionIRI = VALUE_FACTORY.createIRI("urn:test");
    private final Action action = actionFactory.createNew(actionIRI);

    private final String yaml = "- name: " + actionIRI + "\n"
            + "  command: echo \"WOW\"";

    @Test
    public void testConstructor() {
        DaguActionDefinition definition = new DaguActionDefinition(yaml, action);
        assertEquals(yaml, definition.toString());
        assertEquals(1, definition.getStepNames().size());
        assertEquals(actionIRI.stringValue(), definition.getStepNames().get(0));
        assertEquals(action, definition.getAction());
    }

    @Test(expected = MobiException.class)
    public void testInvalidYaml() {
        String invalidYaml = "LBOQ#*TQ#BQ-+=";
        new DaguActionDefinition(invalidYaml, action);
    }

    @Test
    public void testAddDependency() {
        IRI otherActionIRI = VALUE_FACTORY.createIRI("urn:test2");
        Action otherAction = actionFactory.createNew(otherActionIRI);
        String otherYaml = "- name: " + otherActionIRI + "\n"
                + "  command: echo \"AMAZING\"";
        DaguActionDefinition otherDefinition = new DaguActionDefinition(otherYaml, otherAction);

        String expectedYaml = yaml + "\n"
                + "  depends:\n    - " + otherActionIRI;
        DaguActionDefinition definition = new DaguActionDefinition(yaml, action);
        definition.addDependency(otherDefinition);
        assertEquals(expectedYaml, definition.toString());
    }

    @Test(expected = MobiException.class)
    public void testAddDependencyNotDagu() {
        ActionDefinition otherDefinition = new ActionDefinition() {
            @Override
            public void addDependency(ActionDefinition parentAction) {

            }

            @Override
            public Action getAction() {
                return null;
            }
        };
        DaguActionDefinition definition = new DaguActionDefinition(yaml, action);
        definition.addDependency(otherDefinition);
    }
}
