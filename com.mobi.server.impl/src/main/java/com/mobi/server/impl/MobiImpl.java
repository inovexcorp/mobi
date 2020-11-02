package com.mobi.server.impl;

/*-
 * #%L
 * com.mobi.server.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
import com.mobi.server.api.Mobi;
import com.mobi.server.api.MobiConfig;
import com.mobi.server.api.ServerUtils;
import com.mobi.service.config.ConfigUtils;
import org.apache.commons.io.IOUtils;
import org.apache.commons.validator.routines.UrlValidator;
import org.osgi.service.cm.Configuration;
import org.osgi.service.cm.ConfigurationAdmin;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.HashMap;
import java.util.Hashtable;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import javax.ws.rs.client.Client;
import javax.ws.rs.client.ClientBuilder;
import javax.ws.rs.client.Entity;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

@Component(immediate = true, name = MobiImpl.SERVICE_NAME)
public class MobiImpl implements Mobi {

    public static final String SERVICE_NAME = "com.mobi.platform.server";

    private static final Logger LOGGER = LoggerFactory.getLogger(MobiImpl.class);

    private ConfigurationAdmin configurationAdmin;
    private UUID serverId;
    private String hostName;
    private ServerUtils utils;

    private static String PRODUCT_ID = "";

    static {
        try {
            PRODUCT_ID = IOUtils.toString(
                    MobiImpl.class.getResourceAsStream("/product/prod_id.txt"),
                    "UTF-8"
            ).trim();
        } catch (IOException | NullPointerException e) {
            LOGGER.debug("Product ID is not configured");
        }
    }

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
            ConfigUtils.updateServiceConfig(data, configurationAdmin, SERVICE_NAME);
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

        String[] schemes = {"http", "https"};
        UrlValidator urlValidator = new UrlValidator(schemes, UrlValidator.ALLOW_LOCAL_URLS);
        if (serviceConfig.hostName() == null) {
            LOGGER.info("Host Name not present in service configuration. Setting to empty string.");
            this.hostName = "";
        } else if (urlValidator.isValid(serviceConfig.hostName())) {
            LOGGER.info("Host Name present in service configuration. Setting to {}", serviceConfig.hostName());
            this.hostName = serviceConfig.hostName();
        } else {
            LOGGER.info("Host Name in service configuration is invalid. Setting to empty string.");
            this.hostName = "";
        }

        if (!PRODUCT_ID.isEmpty()) {
            ExecutorService executor = Executors.newSingleThreadExecutor();
            executor.submit(() -> {
                LOGGER.debug("Product ID configured, tracking server start");
                Client client = ClientBuilder.newClient();
                Response response = client.target("http://www.google-analytics.com/collect")
                        .queryParam("v", 1)
                        .queryParam("tid", PRODUCT_ID)
                        .queryParam("cid", serverId.toString())
                        .queryParam("t", "event")
                        .queryParam("ec", "Server")
                        .queryParam("ea", "Start")
                        .request()
                        .post(Entity.entity("", MediaType.APPLICATION_JSON_TYPE));
                LOGGER.debug("Response " + response.getStatus());
            });
            try {
                executor.shutdown();
                executor.awaitTermination(60, TimeUnit.SECONDS);
            } catch (InterruptedException e) {
                LOGGER.debug("Shutdown tracking server start");
            } finally {
                if (!executor.isTerminated()) {
                    LOGGER.debug("Tracking of server start not completed. Cancelling now");
                }
                executor.shutdownNow();
                LOGGER.debug("Shutdown of server start completed");
            }
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
}
