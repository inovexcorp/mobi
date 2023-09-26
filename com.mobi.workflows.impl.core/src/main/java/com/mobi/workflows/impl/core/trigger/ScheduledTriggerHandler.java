package com.mobi.workflows.impl.core.trigger;

/*-
 * #%L
 * com.mobi.workflows.impl.core
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

import com.mobi.workflows.impl.ontologies.workflows.ScheduledTrigger;
import com.mobi.workflows.api.trigger.BaseTriggerHandler;
import com.mobi.workflows.api.trigger.TriggerHandler;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.InputStream;
import java.util.Map;

@Component(
        immediate = true,
        name = ScheduledTriggerHandler.NAME,
        service = { TriggerHandler.class, ScheduledTriggerHandler.class })
public class ScheduledTriggerHandler extends BaseTriggerHandler<ScheduledTrigger>
        implements TriggerHandler<ScheduledTrigger> {
    private final Logger log = LoggerFactory.getLogger(ScheduledTriggerHandler.class);

    static final String NAME = "com.mobi.workflows.impl.core.trigger.ScheduledTriggerHandler";

    @Override
    protected void setPid() {
        this.pid = ScheduledTriggerService.NAME;
    }

    @Activate
    protected void start() {
        log.debug("Starting ScheduledTriggerHandler");
        startService();
    }

    @Override
    protected void setConfigurationProperties(ScheduledTrigger trigger, Map<String, Object> properties) {
        String cronExpression = trigger.getCron()
                .orElseThrow(() -> new IllegalArgumentException("ScheduledTrigger missing required cron property"));
        properties.put("scheduler.expression", cronExpression);
    }

    @Override
    public String getTypeIRI() {
        return ScheduledTrigger.TYPE;
    }

    @Override
    public InputStream getShaclDefinition() {
        return ScheduledTrigger.class.getResourceAsStream("/triggerOntology.ttl");
    }
}
