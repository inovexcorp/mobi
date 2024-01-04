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

import com.mobi.workflows.api.trigger.BaseTriggerHandler;
import com.mobi.workflows.api.trigger.TriggerHandler;
import com.mobi.workflows.impl.ontologies.workflows.CommitToBranchTrigger;

import org.eclipse.rdf4j.model.Resource;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.InputStream;
import java.util.Map;

@Component(
        immediate = true,
        name = CommitToBranchTriggerHandler.NAME,
        service = { TriggerHandler.class, CommitToBranchTriggerHandler.class })
public class CommitToBranchTriggerHandler extends BaseTriggerHandler<CommitToBranchTrigger>
        implements TriggerHandler<CommitToBranchTrigger> {
    private static final Logger LOG = LoggerFactory.getLogger(CommitToBranchTriggerHandler.class);
    static final String NAME = "com.mobi.workflows.impl.dagu.trigger.CommitToBranchTriggerHandler";

    @Activate
    protected void start() {
        LOG.debug("Starting CommitToBranchTriggerHandler");
        startService();
    }

    @Override
    protected void setPid() {
        this.pid = CommitToBranchTriggerService.NAME;
    }

    @Override
    protected void setConfigurationProperties(CommitToBranchTrigger trigger, Map<String, Object> properties) {
        Resource branchIri = trigger.getWatchesBranch_resource()
                .orElseThrow(() -> new IllegalArgumentException("CommitToBranchTrigger missing required watchesBranch "
                        + "property"));
        properties.put("branchIri", branchIri.stringValue());
    }

    @Override
    public String getTypeIRI() {
        return CommitToBranchTrigger.TYPE;
    }

    @Override
    public InputStream getShaclDefinition() {
        return CommitToBranchTriggerHandler.class.getResourceAsStream("/triggerOntology.ttl");
    }
}
