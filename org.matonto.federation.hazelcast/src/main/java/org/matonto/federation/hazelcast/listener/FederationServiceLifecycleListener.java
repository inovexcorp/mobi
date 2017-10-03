package org.matonto.federation.hazelcast.listener;

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

import com.hazelcast.core.LifecycleEvent;
import com.hazelcast.core.LifecycleListener;
import com.hazelcast.core.MemberAttributeEvent;
import com.hazelcast.core.MembershipEvent;
import com.hazelcast.core.MembershipListener;
import org.matonto.federation.hazelcast.HazelcastFederationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * This {@link LifecycleListener} implementation provides hooks for the {@link HazelcastFederationService}
 * implementation of the {@link org.matonto.federation.api.FederationService} to listen to changes in the federation.
 */
public class FederationServiceLifecycleListener implements LifecycleListener, MembershipListener {

    private static final Logger LOGGER = LoggerFactory.getLogger(FederationServiceLifecycleListener.class);

    @Override
    public void stateChanged(LifecycleEvent event) {
        LOGGER.debug("{}: State Change: {}: {}", this.toString(), event.getState().name(), event.toString());
    }

    @Override
    public void memberAdded(MembershipEvent membershipEvent) {
        membershipEvent.getMembers().forEach(member -> {
            LOGGER.debug("{}: Member was added to our federation: {}", this.toString(), member.getAddress());
        });
    }

    @Override
    public void memberRemoved(MembershipEvent membershipEvent) {
        membershipEvent.getMembers().forEach(member -> {
            LOGGER.debug("{}: Member was removed from our federation: {}", this.toString(), member.getAddress());
        });
    }

    @Override
    public void memberAttributeChanged(MemberAttributeEvent memberAttributeEvent) {
        memberAttributeEvent.getMembers().forEach(member -> {
            LOGGER.debug("{}: Member was modified on our federation: {}", this.toString(), member.getAddress());
        });
    }
}
