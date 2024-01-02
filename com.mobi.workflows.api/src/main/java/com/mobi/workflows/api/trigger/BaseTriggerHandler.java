package com.mobi.workflows.api.trigger;

/*-
 * #%L
 * com.mobi.workflows.api
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

import com.mobi.exception.MobiException;
import com.mobi.service.config.ConfigUtils;
import com.mobi.workflows.api.ontologies.workflows.Trigger;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.osgi.service.cm.Configuration;
import org.osgi.service.cm.ConfigurationAdmin;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

public abstract class BaseTriggerHandler<T extends Trigger> implements TriggerHandler<T> {
    protected Map<Resource, String> triggerServices;
    protected String pid;

    @Reference
    protected ConfigurationAdmin configAdmin;

    private static final Logger LOG = LoggerFactory.getLogger(BaseTriggerHandler.class);
    final ValueFactory vf = new ValidatingValueFactory();

    protected abstract void setPid();

    protected void startService() {
        setPid();
        if (triggerServices == null) {
            LOG.debug("Initializing TriggerServices map");
            triggerServices = new HashMap<>();
        }
        // Get all existing configurations
        try {
            LOG.debug("Fetching existing configurations for " + this.getTypeIRI());
            Configuration[] configurations = configAdmin.listConfigurations("(service.pid=" + this.pid + "*)");
            if (configurations != null) {
                for (Configuration configuration: configurations) {
                    Map<String, Object> properties = ConfigUtils.getPropertiesMap(configuration);
                    String triggerId = Optional.ofNullable(properties.get("triggerId"))
                            .orElseThrow(() -> new IllegalStateException("TriggerService configuration "
                                    + "missing triggerId property")).toString();
                    LOG.debug("Adding TriggerService for " + triggerId);
                    triggerServices.put(vf.createIRI(triggerId), configuration.getPid());
                }
            } else {
                LOG.debug("Could not find any existing configurations for " + this.getTypeIRI());
            }
        } catch (Exception e) {
            throw new MobiException("Issue occurred during service startup", e);
        }
    }

    @Override
    public void create(Resource workflowId, T trigger) {
        LOG.debug("Creating " + trigger.getResource() + " of type " + this.getTypeIRI() + " for Workflow "
                + workflowId);
        if (triggerServices.containsKey(trigger.getResource())) {
            throw new IllegalArgumentException("Trigger " + trigger.getResource() + " already exists");
        }
        // Use Config admin to create configuration
        LOG.trace("Creating configuration");
        Configuration configuration;
        try {
            configuration = configAdmin.createFactoryConfiguration(pid, null);
        } catch (IOException e) {
            throw new MobiException("Error creating new TriggerService Configuration", e);
        }

        // Instantiate with the workflow and trigger config
        LOG.trace("Creating properties");
        Map<String, Object> properties = new HashMap<>();
        properties.put("workflowId", workflowId.stringValue());
        properties.put("triggerId", trigger.getResource().stringValue());
        setConfigurationProperties(trigger, properties);
        LOG.trace("Updating configuration");
        ConfigUtils.updateServiceConfig(properties, configuration);

        // Store in Map
        LOG.trace("Storing configuration in map");
        this.triggerServices.put(trigger.getResource(), configuration.getPid());
        LOG.debug("Created TriggerService for " + trigger.getResource());
    }

    protected abstract void setConfigurationProperties(T trigger, Map<String, Object> properties);

    @Override
    public boolean exists(Resource triggerId) {
        return this.triggerServices.containsKey(triggerId);
    }

    @Override
    public void update(T trigger) {
        LOG.debug("Updating configuration for " + trigger.getResource() + " of type " + this.getTypeIRI() + " in map");
        if (triggerServices.containsKey(trigger.getResource())) {
            Configuration configuration = getConfiguration(trigger.getResource());
            LOG.trace("Creating properties");
            Map<String, Object> properties = ConfigUtils.getPropertiesMap(configuration);
            setConfigurationProperties(trigger, properties);
            LOG.trace("Updating configuration");
            ConfigUtils.updateServiceConfig(properties, configuration);
            LOG.debug("Updated TriggerService for " + trigger.getResource());
        } else {
            LOG.debug("Trigger " + trigger.getResource() + " does not exist in map for " + this.getTypeIRI());
        }
    }

    @Override
    public void remove(Resource triggerId) {
        LOG.debug("Removing configuration for " + triggerId + " of type " + this.getTypeIRI());
        if (triggerServices.containsKey(triggerId)) {
            Configuration configuration = getConfiguration(triggerId);
            if (configuration != null) {
                LOG.trace("Removing TriggerService");
                try {
                    configuration.delete();
                    triggerServices.remove(triggerId);
                    LOG.debug("Removed TriggerService for " + triggerId);
                } catch (IOException e) {
                    throw new MobiException("Could not remove TriggerService for " + triggerId, e);
                }
            } else {
                LOG.debug("Trigger configuration for " + triggerId + " is null");
            }
        } else {
            LOG.debug("Trigger " + triggerId + " does not exist in map for " + this.getTypeIRI());
        }
    }

    protected Configuration getConfiguration(Resource triggerId) {
        String pid = triggerServices.get(triggerId);
        try {
            return configAdmin.getConfiguration(pid);
        } catch (IOException e) {
            throw new MobiException("Issue retrieving TriggerService Configuration for " + triggerId, e);
        }
    }
}
