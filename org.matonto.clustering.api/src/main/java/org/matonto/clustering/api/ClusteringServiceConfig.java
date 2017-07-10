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

import aQute.bnd.annotation.metatype.Meta;

/**
 * This interface describes the base service configuration for a {@link ClusteringService} implementation.
 */
@Meta.OCD
public interface ClusteringServiceConfig {

    /**
     *
     * @return An ID for the clustering service instance.
     */
    String id();

    /**
     *
     * @return Whether or not the {@link ClusteringService} should be enabled.
     */
    @Meta.AD(deflt = "false", required = false)
    boolean enabled();

    /**
     *
     * @return The name of the clustering service instance.
     */
    @Meta.AD(required = false)
    String title();

    /**
     *
     * @return A brief description of the clustering service.
     */
    @Meta.AD(required = false)
    String description();
}
