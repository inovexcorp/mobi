package org.matonto.clustering.hazelcast;

/*-
 * #%L
 * clustering.hazelcast
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

import aQute.bnd.annotation.metatype.Meta;
import org.matonto.clustering.api.ClusteringServiceConfig;

import java.util.Set;

@Meta.OCD(factory = true)
public interface HazelcastClusteringServiceConfig extends ClusteringServiceConfig {

    @Meta.AD(required = false)
    String instanceName();

    @Meta.AD(required = false)
    int basicPort();

    @Meta.AD(required = false)
    int multicastPort();

    @Meta.AD(required = false)
    Set<Integer> outboundPorts();

    @Meta.AD(required = false)
    String groupConfigName();

    @Meta.AD(required = false)
    String groupConfigPassword();

}
