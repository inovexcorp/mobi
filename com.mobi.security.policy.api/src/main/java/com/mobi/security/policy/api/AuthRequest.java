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

import com.mobi.rdf.api.Literal;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;

public class AuthRequest {
    private String subjectId;
    private Map<String, Literal> subjectAttrs;
    private String resourceId;
    private Map<String, Literal> resourceAttrs;
    private Action action;
    private Map<String, Literal> actionAttrs;
    private OffsetDateTime currentTime;
    private boolean returnPolicyIds;

    private AuthRequest(Builder builder) {
        this.subjectId = builder.subjectId;
        this.subjectAttrs = builder.subjectAttrs;
        this.resourceId = builder.resourceId;
        this.resourceAttrs = builder.resourceAttrs;
        this.action = builder.action;
        this.actionAttrs = builder.actionAttrs;
        this.currentTime = builder.currentTime;
        this.returnPolicyIds = builder.returnPolicyIds;
    }

    public String getSubjectId() {
        return subjectId;
    }

    public String getResourceId() {
        return resourceId;
    }

    public Action getAction() {
        return action;
    }

    public OffsetDateTime getCurrentTime() {
        return currentTime;
    }

    public boolean isReturnPolicyIds() {
        return returnPolicyIds;
    }

    public Map<String, Literal> getSubjectAttrs() {
        return subjectAttrs;
    }

    public Map<String, Literal> getResourceAttrs() {
        return resourceAttrs;
    }

    public Map<String, Literal> getActionAttrs() {
        return actionAttrs;
    }

    public static class Builder {
        private String subjectId;
        private Map<String, Literal> subjectAttrs = new HashMap<>();
        private String resourceId;
        private Map<String, Literal> resourceAttrs = new HashMap<>();
        private Action action;
        private Map<String, Literal> actionAttrs = new HashMap<>();
        private OffsetDateTime currentTime;
        private boolean returnPolicyIds = false;

        public Builder(String subjectId, String resourceId, Action action, OffsetDateTime currentTime) {
            this.subjectId = subjectId;
            this.resourceId = resourceId;
            this.action = action;
            this.currentTime = currentTime;
        }

        public Builder addSubjectAttr(String key, Literal value) {
            subjectAttrs.put(key, value);
            return this;
        }

        public Builder addResourceAttr(String key, Literal value) {
            resourceAttrs.put(key, value);
            return this;
        }

        public Builder addActionAttr(String key, Literal value) {
            actionAttrs.put(key, value);
            return this;
        }

        public Builder returnPolicyIds() {
            this.returnPolicyIds = true;
            return this;
        }

        public AuthRequest build() {
            return new AuthRequest(this);
        }
    }
}
