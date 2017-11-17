package com.mobi.platform.config.impl.server;

import com.mobi.exception.MobiException;
import com.mobi.platform.config.api.server.ServerUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.UnsupportedEncodingException;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.SocketException;
import java.net.UnknownHostException;
import java.util.Enumeration;
import java.util.UUID;

public class SimpleServerUtils implements ServerUtils {

    private static final Logger LOGGER = LoggerFactory.getLogger(SimpleServerUtils.class);

    @Override
    public byte[] getMacId() throws MobiException {
        try {
            final InetAddress ip = getLocalhost();
            final NetworkInterface network = NetworkInterface.getByInetAddress(ip);
            final byte[] mac_byte = network.getHardwareAddress();
            if (mac_byte == null) {
                LOGGER.warn("Could not determine MAC ID to generate server ID. Falling back to random UUID.");
                return UUID.randomUUID().toString().getBytes("UTF-8");
            }
            return mac_byte;
        } catch (SocketException e) {
            throw new MobiException("Issue determining MAC ID of server to generate our unique server ID", e);
        } catch (UnsupportedEncodingException e) {
            throw new MobiException("Unsupported character encoding used to generate byte array.", e);
        }
    }

    @Override
    public InetAddress getLocalhost() throws MobiException {
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
        } catch (SocketException e) {
            throw new MobiException("Unable to get local host address.", e);
        }
    }
}
