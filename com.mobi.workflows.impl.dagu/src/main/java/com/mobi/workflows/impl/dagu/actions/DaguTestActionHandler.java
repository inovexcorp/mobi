package com.mobi.workflows.impl.dagu.actions;

/*-
 * #%L
 * com.mobi.workflows.impl.dagu
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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

import com.mobi.workflows.api.action.ActionDefinition;
import com.mobi.workflows.api.action.ActionHandler;
import com.mobi.workflows.api.ontologies.workflows.TestAction;
import org.osgi.service.component.annotations.Component;

import java.io.InputStream;

@Component(
        immediate = true,
        service = {ActionHandler.class, DaguTestActionHandler.class })
public class DaguTestActionHandler implements ActionHandler<TestAction> {
    @Override
    public ActionDefinition createDefinition(TestAction action) {
        String message = action.getTestMessage()
                .orElseThrow(() -> new IllegalStateException("TestAction must have a message"));
        String step = "- name: " + action.getResource() + "\n"
                + "  command: echo \"" + message + "\"";
        return new DaguActionDefinition(step);
    }

    @Override
    public String getTypeIRI() {
        return TestAction.TYPE;
    }

    @Override
    public InputStream getShaclDefinition() {
        return ActionHandler.class.getResourceAsStream("/workflows.ttl");
    }
}
