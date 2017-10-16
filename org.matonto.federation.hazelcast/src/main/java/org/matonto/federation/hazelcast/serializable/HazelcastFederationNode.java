package org.matonto.federation.hazelcast.serializable;

/*-
 * #%L
 * org.matonto.federation.hazelcast
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

import org.matonto.federation.api.ontologies.federation.FederationNode;
import org.matonto.federation.api.ontologies.federation.FederationNodeFactory;
import org.matonto.rdf.api.ValueFactory;

import java.io.Serializable;
import java.time.OffsetDateTime;
import java.util.Set;
import java.util.TreeSet;

/**
 * Class for serializing information about a {@link FederationNode}.
 *
 * @author Sean Smitz &lt;sean.smitz@inovexcorp.com&gt;
 */
public class HazelcastFederationNode implements Serializable {

    private static final long serialVersionUID = 0l;

    private final String fedNodeIri;
    private final String fedNodeId;
    private final String host;
    private final Set<String> gateway = new TreeSet<>();

    private boolean nodeActive;
    private OffsetDateTime nodeLastUpdated;

    public HazelcastFederationNode(String podNodeIri, String podNodeId, String host, Set<String> gateway) {
        this.fedNodeIri = podNodeIri;
        this.fedNodeId = podNodeId;
        this.host = host;
        this.gateway.addAll(gateway);
    }

    public HazelcastFederationNode(FederationNode node) {
        fedNodeIri = node.getResource().stringValue();
        fedNodeId = node.getNodeId().orElse("");
        host = node.getHost().orElse("");

        if (node.getGateway() != null && !node.getGateway().isEmpty()) {
            gateway.addAll(node.getGateway());
        }
        nodeActive = node.getNodeActive().orElse(true);
        nodeLastUpdated = node.getNodeLastUpdated().orElse(OffsetDateTime.now());
    }

    public String getFedNodeIri() {
        return fedNodeIri;
    }

    public String getFedNodeId() {
        return fedNodeId;
    }

    public String getHost() {
        return host;
    }

    public Set<String> getGateway() {
        return gateway;
    }

    public boolean isNodeActive() {
        return nodeActive;
    }

    public void setNodeActive(boolean nodeActive) {
        this.nodeActive = nodeActive;
    }

    public OffsetDateTime getNodeLastUpdated() {
        return nodeLastUpdated;
    }

    public void setNodeLastUpdated(OffsetDateTime nodeLastUpdated) {
        this.nodeLastUpdated = nodeLastUpdated;
    }

    public static FederationNode getAsFederationNode(HazelcastFederationNode node, FederationNodeFactory factory,
                                                     ValueFactory vf) {
        FederationNode fedNode = factory.createNew(vf.createIRI(node.fedNodeIri));

        fedNode.setNodeId(node.fedNodeId);
        fedNode.setHost(node.host);

        if (!node.gateway.isEmpty()) {
            fedNode.setGateway(node.getGateway());
        }

        fedNode.setNodeActive(node.isNodeActive());
        fedNode.setNodeLastUpdated(node.getNodeLastUpdated());

        return fedNode;
    }
}
