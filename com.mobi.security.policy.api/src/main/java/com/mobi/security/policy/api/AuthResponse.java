package com.mobi.security.policy.api;

/*-
 * #%L
 * com.mobi.security.policy.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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

import com.mobi.rdf.api.Resource;

import java.util.ArrayList;
import java.util.List;

public class AuthResponse {
    private Decision decision;
    private String statusMessage;
    private List<Resource> policyIds;

    private AuthResponse(Builder builder) {
        this.decision = builder.decision;
        this.statusMessage = builder.statusMessage;
        this.policyIds = builder.policyIds;
    }

    public Decision getDecision() {
        return decision;
    }

    public String getStatusMessage() {
        return statusMessage;
    }

    public List<Resource> getPolicyIds() {
        return policyIds;
    }

    public static class Builder {
        private Decision decision;
        private String statusMessage = "";
        private List<Resource> policyIds = new ArrayList<>();

        public Builder(Decision decision) {
            this.decision = decision;
        }

        public Builder statusMessage(String statusMessage) {
            this.statusMessage = statusMessage;
            return this;
        }

        public Builder policyIds(List<Resource> policyIds) {
            this.policyIds = policyIds;
            return this;
        }

        public AuthResponse build() {
            return new AuthResponse(this);
        }
    }
}
