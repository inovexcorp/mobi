package com.mobi.server.utils;

/*-
 * #%L
 * server.utils
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.SocketException;
import java.net.UnknownHostException;
import java.nio.charset.StandardCharsets;
import java.util.Enumeration;
import java.util.UUID;

/**
 * Utility class for generating a unique server identifier based on the system's network information.
 */
public class ServerIdUtils {
    private static final Logger LOGGER = LoggerFactory.getLogger(ServerIdUtils.class);

    /**
     * Generates a unique server identifier based on the system's MAC address.
     *
     * @return a {@link UUID} representing the server's unique identifier
     * @throws MobiException if there is an issue retrieving the MAC address
     */
    public static UUID getServerId() {
        final byte[] macId = getMacId();
        return UUID.nameUUIDFromBytes(macId);
    }

    /**
     * Retrieves the MAC address of the server as a byte array.
     * <p>
     * This method attempts to identify the server's local network interface and obtain its hardware
     * address (MAC address). If a MAC address cannot be determined, it falls back to generating
     * a random UUID as a byte array.
     * </p>
     *
     * @return a byte array representing the MAC address of the server, or a random UUID if the MAC
     *         address cannot be determined
     * @throws MobiException if there is a problem accessing the network interfaces
     */
    public static byte[] getMacId() {
        try {
            final InetAddress ip = getLocalhost();
            final NetworkInterface network = NetworkInterface.getByInetAddress(ip);
            final byte[] mac_byte = network.getHardwareAddress();
            if (mac_byte == null) {
                LOGGER.warn("Could not determine MAC ID to generate server ID. Falling back to random UUID.");
                return UUID.randomUUID().toString().getBytes(StandardCharsets.UTF_8);
            }
            return mac_byte;
        } catch (SocketException e) {
            throw new MobiException("Issue determining MAC ID of server to generate our unique server ID", e);
        }
    }

    /**
     * Attempts to determine the local host IP address of the server.
     * <p>
     * The method first iterates through all network interfaces and their associated IP addresses
     * to find a non-loopback, non-link-local, site-local address. If none are found, it falls back
     * to {@link InetAddress#getLocalHost()} as a last resort.
     * </p>
     *
     * @return the {@link InetAddress} representing the local host address
     * @throws MobiException if there is a problem accessing network interfaces or resolving localhost
     */
    private static InetAddress getLocalhost() {
        InetAddress ip = null;
        // Try and identify the local network interface to get the mac address from via network interfaces.
        try {
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
                LOGGER.warn("Couldn't identify local network address via the network interfaces... "
                        + "Going to look up via the hosts database mechanism");
                try {
                    ip = InetAddress.getLocalHost();
                } catch (UnknownHostException e) {
                    throw new MobiException("Issue identifying localhost network interface... Please check your "
                            + "network configuration.", e);
                }
            } else {
                LOGGER.debug("Successfully identified local network address via the network interfaces.");
            }
            return ip;
        } catch (SocketException e) {
            throw new MobiException("Unable to get local host address.", e);
        }
    }

    public static void main(String[] args) {
        LOGGER.info("Server identifier: {}", getServerId());
        LOGGER.info("Server identifier Retrieved");
    }
}
