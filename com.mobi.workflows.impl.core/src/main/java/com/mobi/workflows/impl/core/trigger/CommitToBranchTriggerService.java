package com.mobi.workflows.impl.core.trigger;

/*-
 * #%L
 * com.mobi.workflows.impl.dagu
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

import com.mobi.catalog.api.CatalogTopics;
import com.mobi.workflows.api.trigger.BaseEventTriggerService;
import com.mobi.workflows.api.trigger.TriggerService;
import com.mobi.workflows.impl.ontologies.workflows.CommitToBranchTrigger;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.ConfigurationPolicy;
import org.osgi.service.component.annotations.Modified;
import org.osgi.service.event.Event;
import org.osgi.service.event.EventConstants;
import org.osgi.service.event.EventHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;

@Component(
        immediate = true,
        name = CommitToBranchTriggerService.NAME,
        service = { CommitToBranchTriggerService.class, TriggerService.class, EventHandler.class },
        property = EventConstants.EVENT_TOPIC + "=" + CatalogTopics.TOPIC_NAME,
        configurationPolicy = ConfigurationPolicy.REQUIRE)
public class CommitToBranchTriggerService extends BaseEventTriggerService<CommitToBranchTrigger>
        implements TriggerService<CommitToBranchTrigger>, EventHandler {
    private final Logger log = LoggerFactory.getLogger(CommitToBranchTriggerService.class);
    static final String NAME = "com.mobi.workflows.impl.dagu.trigger.CommitToBranchTriggerService";
    final ValueFactory vf = new ValidatingValueFactory();

    private Resource branchIri;

    @Activate
    @Modified
    protected void start(Map<String, Object> properties) {
        startService(properties);
        this.branchIri = vf.createIRI(properties.get("branchIri").toString());
        log.trace("Started CommitToBranchTriggerService for " + triggerId + " and " + workflowId + " with Branch "
                + branchIri);
    }

    @Override
    public void handleEvent(Event event) {
        String firedBranch = event.getProperty(CatalogTopics.PROPERTY_BRANCH).toString();
        log.trace("Received event in CommitToBranchTriggerService for " + triggerId + " with Branch " + firedBranch);
        if (firedBranch.equals(branchIri.stringValue())) {
            log.trace("Posting event from CommitToBranchTriggerService for " + triggerId);
            this.trigger();
        }
    }
}
