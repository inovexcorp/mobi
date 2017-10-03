package org.matonto.federation.hazelcast;

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

import com.hazelcast.config.Config;
import com.hazelcast.core.Hazelcast;
import com.hazelcast.osgi.HazelcastOSGiInstance;
import com.hazelcast.osgi.HazelcastOSGiService;
import org.osgi.framework.Bundle;

import java.util.Set;

public class FakeHazelcastOsgiService implements HazelcastOSGiService {

    @Override
    public String getId() {
        return null;
    }

    @Override
    public Bundle getOwnerBundle() {
        return null;
    }

    @Override
    public HazelcastOSGiInstance getDefaultHazelcastInstance() {
        return new FakeHazelcastOsgiInstance(Hazelcast.newHazelcastInstance(), this);
    }

    @Override
    public HazelcastOSGiInstance newHazelcastInstance(Config config) {
        return new FakeHazelcastOsgiInstance(Hazelcast.newHazelcastInstance(config), this);
    }

    @Override
    public HazelcastOSGiInstance newHazelcastInstance() {
        return null;
    }

    @Override
    public HazelcastOSGiInstance getHazelcastInstanceByName(String instanceName) {
        return null;
    }

    @Override
    public Set<HazelcastOSGiInstance> getAllHazelcastInstances() {
        return null;
    }

    @Override
    public void shutdownHazelcastInstance(HazelcastOSGiInstance instance) {

    }

    @Override
    public void shutdownAll() {

    }
}
