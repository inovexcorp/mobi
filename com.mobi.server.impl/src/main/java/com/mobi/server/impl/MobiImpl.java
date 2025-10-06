package com.mobi.server.impl;

/*-
 * #%L
 * com.mobi.server.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
import com.mobi.server.api.Mobi;
import com.mobi.server.api.MobiConfig;
import com.mobi.server.utils.ServerIdUtils;
import com.mobi.service.config.ConfigUtils;
import org.apache.commons.io.IOUtils;
import org.apache.commons.validator.routines.UrlValidator;
import org.osgi.service.cm.ConfigurationAdmin;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Modified;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import javax.ws.rs.client.Client;
import javax.ws.rs.client.ClientBuilder;
import javax.ws.rs.client.Entity;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

@Component(
        immediate = true,
        name = MobiImpl.SERVICE_NAME
)
public class MobiImpl implements Mobi {
    public static final String SERVICE_NAME = "com.mobi.platform.server";
    private static final Logger LOGGER = LoggerFactory.getLogger(MobiImpl.class);

    private UUID serverId;
    private String hostName;
    private static String PRODUCT_ID = "";

    static {
        try {
            PRODUCT_ID = IOUtils.toString(
                    Objects.requireNonNull(MobiImpl.class.getResourceAsStream("/product/prod_id.txt")),
                    StandardCharsets.UTF_8
            ).trim();

        } catch (IOException | NullPointerException e) {
            LOGGER.debug("Product ID is not configured");
        }
    }

    @Reference
    ConfigurationAdmin configurationAdmin;

    @Activate
    @Modified
    public void activate(final MobiConfig serviceConfig) {
        LOGGER.warn("Recalculating serverId UUID from the MAC ID of this machine at start up.");
        this.serverId = ServerIdUtils.getServerId();
        if (!this.serverId.toString().equals(serviceConfig.serverId())) {
            try {
                Map<String, Object> data = ConfigUtils.getPropertiesMap(this.configurationAdmin.getConfiguration(SERVICE_NAME));
                data.put("serverId", this.serverId.toString());
                ConfigUtils.updateServiceConfig(data, configurationAdmin, SERVICE_NAME);
                return;
            } catch (IOException e) {
                LOGGER.error("Could not get configuration for " + SERVICE_NAME, e);
                throw new MobiException(e);
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
