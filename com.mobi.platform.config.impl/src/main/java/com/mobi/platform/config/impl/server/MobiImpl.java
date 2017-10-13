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
import aQute.bnd.annotation.component.Reference;
import aQute.bnd.annotation.metatype.Configurable;
import com.mobi.exception.MobiException;
import com.mobi.platform.config.api.server.Mobi;
import com.mobi.platform.config.api.server.MobiConfig;
import org.osgi.service.cm.Configuration;
import org.osgi.service.cm.ConfigurationAdmin;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
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

    @Activate
    public void activate(final Map<String, Object> configuration) {
        final MobiConfig serviceConfig = Configurable.createConfigurable(MobiConfig.class, configuration);
        if (serviceConfig.serverId() == null) {
            LOGGER.warn("No server id configured in startup, going to rebuild our Server UUID from the MAC ID of this machine.");
            final byte[] macId = getMacId();
            this.serverId = UUID.nameUUIDFromBytes(macId);
            final Map<String, Object> data = new HashMap<>(configuration);
            data.put("serverId", this.serverId.toString());
            updateServiceConfig(data);
        } else {
            final String id = serviceConfig.serverId();
            LOGGER.info("Server ID already present in service configuration! {}", id);
            try {
                this.serverId = UUID.fromString(id);
            } catch (IllegalArgumentException e) {
                // If the currently configured server id is invalid (a non-UUID).
                throw new MobiException("Previously configured server ID is invalid: " + id, e);
            }
        }
        LOGGER.info("Initialized core platform server service with id {}", this.serverId);
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

    /**
     * @return The MAC id of the current server
     * @throws MobiException If there is an issue fetching the MAC id
     */
    private static byte[] getMacId() throws MobiException {
        try {
            final InetAddress ip = getLocalhost();
            final NetworkInterface network = NetworkInterface.getByInetAddress(ip);
            final byte[] mac_byte = network.getHardwareAddress();
            if (mac_byte == null) {
                //TODO - use something else generated...?
                throw new MobiException("No MAC ID could be found for this server");
            }
            return mac_byte;
        } catch (SocketException e) {
            throw new MobiException("Issue determining MAC ID of server to generate our unique server ID", e);
        }
    }


    private static InetAddress getLocalhost() throws MobiException, SocketException {
        InetAddress ip = null;
        // Try and identify the local network interface to get the mac address from via network interfaces.
        final Enumeration<NetworkInterface> networkInterfaceEnumeration = NetworkInterface.getNetworkInterfaces();
        while (networkInterfaceEnumeration.hasMoreElements()) {
            final NetworkInterface n = networkInterfaceEnumeration.nextElement();
            final Enumeration<InetAddress> inetAddresses = n.getInetAddresses();
            while (inetAddresses.hasMoreElements()) {
                final InetAddress i = inetAddresses.nextElement();
                if (!i.isLoopbackAddress() && !i.isLinkLocalAddress() && i.isSiteLocalAddress()) {
                    ip = i;
                }
            }
        }
        // Try and identify the localhost network interface if unsuccessful above.
        if (ip == null) {
            LOGGER.warn("Couldn't identify local network address via the network interfaces... " +
                    "Going to look up via the hosts database mechanism");
            try {
                ip = InetAddress.getLocalHost();
            } catch (UnknownHostException e) {
                throw new MobiException("Issue identifying localhost network interface... Please check your " +
                        "network configuration.", e);
            }
        } else {
            LOGGER.debug("Successfully identified local network address via the network interfaces.");
        }
        return ip;
    }
}
