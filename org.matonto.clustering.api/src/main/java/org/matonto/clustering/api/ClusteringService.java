package org.matonto.clustering.api;

/*-
 * #%L
 * clustering.api
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

import java.util.Set;
import java.util.UUID;

/**
 * This service represents a way to navigate the local topology of nodes on the local network.
 */
public interface ClusteringService {

    /**
     * @return The {@link ClusteringServiceConfig} associated with this cluster.
     */
    ClusteringServiceConfig getClusteringServiceConfig();

    /**
     * Start the clustering mechanisms of the service.
     */
    void start();

    /**
     * Stop the clustering mechanisms service.
     */
    void stop();

    /**
     * Restart the clustering mechanisms of the service.
     */
    void restart();

    /**
     * @return The set of UUIDs representing servers that are part of this cluster.
     */
    Set<UUID> getClusteredNodeIds();

    /**
     * @return The number of discovered local nodes in this cluster.
     */
    int getMemberCount();
}
