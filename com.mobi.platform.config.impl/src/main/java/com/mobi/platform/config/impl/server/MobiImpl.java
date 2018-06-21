package com.mobi.platform.config.impl.server;

/*-
 * #%L
 * com.mobi.platform.config.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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


import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Modified;
import aQute.bnd.annotation.component.Reference;
import aQute.bnd.annotation.metatype.Configurable;
import com.mobi.exception.MobiException;
import com.mobi.platform.config.api.server.Mobi;
import com.mobi.platform.config.api.server.MobiConfig;
import com.mobi.platform.config.api.server.ServerUtils;
import org.osgi.service.cm.Configuration;
import org.osgi.service.cm.ConfigurationAdmin;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.SocketException;
import java.net.UnknownHostException;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Hashtable;
import java.util.Map;
import java.util.UUID;

@Component(immediate = true, name = MobiImpl.SERVICE_NAME)
public class MobiImpl implements Mobi {

    public static final String SERVICE_NAME = "com.mobi.platform.server";

    private static final Logger LOGGER = LoggerFactory.getLogger(MobiImpl.class);

    private ConfigurationAdmin configurationAdmin;
    private UUID serverId;
    private String hostName;
    private ServerUtils utils;

    @Reference
    void setServerUtils(ServerUtils utils) {
        this.utils = utils;
    }

    @Activate
    public void activate(final Map<String, Object> configuration) {
        final MobiConfig serviceConfig = Configurable.createConfigurable(MobiConfig.class, configuration);
        if (serviceConfig.serverId() == null) {
            LOGGER.warn("No server id configured in startup, going to rebuild our Server UUID from the MAC ID of this machine.");
            final byte[] macId = utils.getMacId();
            this.serverId = UUID.nameUUIDFromBytes(macId);
            final Map<String, Object> data = new HashMap<>(configuration);
            data.put("serverId", this.serverId.toString());
            updateServiceConfig(data);
        } else {
            final String id = serviceConfig.serverId();
            LOGGER.info("Server ID present in service configuration. {}", id);
            try {
                this.serverId = UUID.fromString(id);
            } catch (IllegalArgumentException e) {
                // If the currently configured server id is invalid (a non-UUID).
                throw new MobiException("Previously configured server ID is invalid: " + id, e);
            }
        }
        LOGGER.info("Initialized core platform server service with id {}", this.serverId);

        if (serviceConfig.hostName() == null) {
            LOGGER.info("Host Name not present in service configuration. Setting to empty string");
            this.hostName = "";
        } else {
            LOGGER.info("Host Name present in service configuration. Setting to {}", hostName);
            this.hostName = serviceConfig.hostName();
        }
    }

    /**
     * Method triggered when the configuration changes for this service.
     *
     * @param configuration The configuration map for this service
     */
    @Modified
    void modified(Map<String, Object> configuration) {
        LOGGER.warn("Modified configuration of service. Going to re-activate with new configuration...");
        activate(configuration);
    }

    /**
     * Inject the {@link ConfigurationAdmin} into our service.
     */
    @Reference
    public void setConfigurationAdmin(ConfigurationAdmin admin) {
        this.configurationAdmin = admin;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public UUID getServerIdentifier() {
        return this.serverId;
    }

    /**
     *
     * {@inheritDoc}
     */
    @Override
    public String getHostName() {
        return this.hostName;
    }

    /**
     * Save an updated service configuration.
     *
     * @param configuration The modified map of configuration to persist
     */
    private void updateServiceConfig(final Map<String, Object> configuration) {
        try {
            final Configuration config = this.configurationAdmin.getConfiguration(SERVICE_NAME);
            config.update(new Hashtable<>(configuration));
        } catch (IOException e) {
            LOGGER.error("Issue saving server id to service configuration: " + SERVICE_NAME, e);
            // Continue along, since we'll just re-generate the service configuration next time the server starts.
        }
    }
}
