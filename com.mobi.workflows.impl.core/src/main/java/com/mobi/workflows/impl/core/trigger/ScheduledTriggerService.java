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
import com.mobi.workflows.api.trigger.BaseTriggerService;
import com.mobi.workflows.api.trigger.TriggerService;
import org.apache.karaf.scheduler.Job;
import org.apache.karaf.scheduler.JobContext;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.ConfigurationPolicy;
import org.osgi.service.component.annotations.Modified;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;

@Component(
        immediate = true,
        name = ScheduledTriggerService.NAME,
        service = { ScheduledTriggerService.class, TriggerService.class, Job.class },
        property = {
                "scheduler.name=ScheduledTriggerService",
                "scheduler.concurrent:Boolean=false"
        },
        configurationPolicy = ConfigurationPolicy.REQUIRE)
public class ScheduledTriggerService extends BaseTriggerService<ScheduledTrigger>
        implements TriggerService<ScheduledTrigger>, Job {
    private final Logger log = LoggerFactory.getLogger(ScheduledTriggerService.class);
    static final String NAME = "com.mobi.workflows.impl.core.trigger.ScheduledTriggerService";

    @Activate
    @Modified
    protected void start(Map<String, Object> properties) {
        startService(properties);
        log.trace("Started ScheduledTriggerService for " + triggerId + " and " + workflowId);
    }

    @Override
    public void execute(JobContext jobContext) {
        log.trace("Executing ScheduledTriggerService job for " + triggerId);
        this.trigger();
    }
}
