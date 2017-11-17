package com.mobi.platform.config.api.server;

import com.mobi.exception.MobiException;

import java.net.InetAddress;
import java.net.SocketException;

public interface ServerUtils {
    /**
     * Gets the MAC id of the current server
     *
     * @return The MAC id of the current server
     * @throws MobiException If there is an issue fetching the MAC id
     */
    byte[] getMacId() throws MobiException;

    /**
     * Tries to identify the local network interface
     *
     * @return The local network address
     * @throws MobiException If there is an issue getting the local host address
     */
    InetAddress getLocalhost() throws MobiException, SocketException;
}
