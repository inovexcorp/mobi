package com.mobi.federation.api;

/*-
 * #%L
 * federation.api
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

import static java.net.URLEncoder.encode;

import com.mobi.federation.api.ontologies.federation.Federation;
import com.mobi.federation.api.ontologies.federation.FederationNode;
import com.mobi.federation.api.ontologies.federation.Node;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jwt.SignedJWT;
import org.jasypt.encryption.pbe.StandardPBEStringEncryptor;
import org.jasypt.encryption.pbe.config.EnvironmentStringPBEConfig;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.text.ParseException;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import javax.servlet.http.HttpServletResponse;

/**
 * This service represents a way to navigate the local topology of nodes on the local network.
 */
public interface FederationService {
    String FEDERATION_BASE = "http://mobi.org/federations/%s";
    String FEDERATION_NODE_BASE = FEDERATION_BASE + "/nodes/%s";
    String NODE_REST_ENDPOINT = "https://%s:8443/mobirest"; // XXX: read this from configuration
    String ENCRYPTION_PASSWORD = "FEDERATION_ENCRYPTION_PASSWORD";

    /**
     * Retrieves the configuration associated with this federation.
     *
     * @return The {@link FederationServiceConfig} associated with this federation.
     */
    FederationServiceConfig getFederationServiceConfig();

    /**
     * Start the federation mechanisms of the service.
     */
    void start();

    /**
     * Stop the federation mechanisms service.
     */
    void stop();

    /**
     * Restart the federation mechanisms of the service.
     */
    void restart();

    /**
     * Retrieves the unique id of this federation as defined in the federation configuration.
     */
    String getFederationId();

    /**
     * Retrieves the unique id of this node in the federation.
     */
    UUID getNodeId();

    /**
     * Creates a {@link String} to be used as the IRI to identify a federation.
     *
     * @param federationId The unique federation ID
     * @return A {@link String} that can be converted directly to an {@link com.mobi.rdf.api.IRI}.
     */
    static String getFederationIri(String federationId) throws UnsupportedEncodingException {
        return String.format(FEDERATION_BASE, encode(federationId, "UTF-8"));
    }

    /**
     * Creates a {@link String} to be used as the IRI to identify a node in the federation.
     *
     * @param federationId The unique federation ID
     * @param nodeId    The unique node ID within the federation.
     * @return A {@link String} that can be converted directly to an {@link com.mobi.rdf.api.IRI}.
     */
    static String getNodeIri(String federationId, String nodeId) throws UnsupportedEncodingException {
        return String.format(FEDERATION_NODE_BASE, encode(federationId, "UTF-8"), encode(nodeId, "UTF-8"));
    }

    /**
     * Returns the REST services endpoint for the specified node.
     *
     * @param nodeId The unique node ID within the federation.
     * @return A {@link String} that can be converted directly to an URL.
     */
    String getNodeRESTEndpoint(UUID nodeId);

    /**
     * Retrieves the Set of UUIDs of nodes within this federation.
     *
     * @return The set of UUIDs representing servers that are part of this federation.
     */
    Set<UUID> getFederationNodeIds();

    /**
     * Retrieves the {@link FederationNode} representing a specific {@link Node} in the {@link Federation}.
     *
     * @param nodeId The ID of the node in the federation.
     * @return {@link FederationNode} if found.
     */
    Optional<FederationNode> getMetadataForNode(String nodeId);

    /**
     * Retrieves the number of members in this federation.
     *
     * @return The number of discovered local nodes in this federation.
     */
    int getMemberCount();

    /**
     * Returns the replicated map with the specified name
     *
     * @param <K>   The {@link Class} of the map key.
     * @param <V>   The {@link Class} of the map values.
     * @param mapId The id of the replicated map to return.
     * @return A {@link Map} that will be distributed and accessible to the other nodes in the federation.
     */
    <K, V> Map<K, V> getDistributedMap(String mapId);

    /**
     * Generates a federation token to be used in node communications.
     *
     * @param res      The response to send error messages to.
     * @param username The username to set as the subject of the token.
     * @return A {@link SignedJWT} token string.
     * @exception IOException Thrown if an input or output exception occurs.
     */
    SignedJWT generateToken(HttpServletResponse res, String username) throws IOException;

    /**
     * Verifies that the provided federation token string.
     *
     * @param tokenString The federation token string.
     * @return An optional containing the {@link SignedJWT} if the token was successfully parsed and verified.
     * @throws ParseException If parsing of the serialised parts failed.
     * @throws JOSEException If the JWS object couldn't be verified.
     */
    Optional<SignedJWT> verifyToken(String tokenString) throws ParseException, JOSEException;

    /**
     * Verifies that the provided federation token string and sends any errors to the {@link HttpServletResponse}.
     *
     * @param tokenString The federation token string.
     * @param res         The response to send error messages to.
     * @return An optional containing the {@link SignedJWT} if the token was successfully parsed and verified.
     * @throws IOException Thrown if an input or output exception occurs.
     */
    Optional<SignedJWT> verifyToken(String tokenString, HttpServletResponse res) throws IOException;

    /**
     * Gets the encryptor needed to decrypt the shared key needed to verify federation tokens.
     *
     * @return The {@link StandardPBEStringEncryptor} needed for decryption.
     */
    static StandardPBEStringEncryptor getEncryptor() {
        StandardPBEStringEncryptor enc = new StandardPBEStringEncryptor();
        EnvironmentStringPBEConfig env = new EnvironmentStringPBEConfig();
        env.setAlgorithm("PBEWithMD5AndDES");
        env.setPassword(ENCRYPTION_PASSWORD);
        enc.setConfig(env);
        return enc;
    }
}
